import { AsyncLocalStorage } from "node:async_hooks";
import { cloudClient } from "@/lib/cloud";

const transaction = new AsyncLocalStorage<{ revision?: number }>();
class Conflict extends Error {}

function withTimeout<T>(promise: PromiseLike<T>, ms = 1800): Promise<T> {
  let timer: NodeJS.Timeout;
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error("Cloud store timeout")), ms);
    }),
  ]).finally(() => {
    clearTimeout(timer);
  });
}

export async function readCloudState<T>(initial?: T): Promise<T> {
  const client = cloudClient();
  if (!client) throw new Error("Cloud store unavailable: Supabase client not configured");
  let { data, error } = await withTimeout(
    client.from("artique_state").select("revision,payload").eq("id", "store").single(),
    1800
  );
  if (error?.code === "PGRST116" && initial) {
    const seeded = await withTimeout(
      client.from("artique_state").upsert({ id: "store", revision: 1, payload: initial }, { onConflict: "id", ignoreDuplicates: true }),
      1800
    );
    if (seeded.error) throw new Error(`Cloud initialization failed: ${seeded.error.message}`);
    ({ data, error } = await withTimeout(
      client.from("artique_state").select("revision,payload").eq("id", "store").single(),
      1800
    ));
  }
  if (error) throw new Error(`Cloud store unavailable: ${error.message}`);
  if (!data) throw new Error("Cloud store is empty.");
  const context = transaction.getStore();
  if (context) context.revision = data.revision;
  return data.payload as T;
}

export async function writeCloudState<T>(payload: T): Promise<void> {
  const revision = transaction.getStore()?.revision;
  if (revision === undefined) throw new Error("Cloud writes require a transaction.");
  const client = cloudClient();
  if (!client) throw new Error("Cloud store unavailable: Supabase client not configured");
  const { data, error } = await withTimeout(
    client.rpc("artique_compare_and_swap", { expected_revision: revision, next_payload: payload }),
    2500
  );
  if (error) throw new Error(`Cloud save failed: ${error.message}`);
  if (!data) throw new Conflict();
}

export function isInCloudTransaction(): boolean {
  return Boolean(transaction.getStore());
}

// PostgreSQL checks the revision atomically across all Vercel instances. A conflict
// reruns validation against fresh stock and orders before attempting another save.
export async function cloudTransaction<T>(operation: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 10; attempt++) {
    try { return await transaction.run({}, operation); }
    catch (error) { if (!(error instanceof Conflict)) throw error; }
  }
  throw new Error("Store is busy. Please retry.");
}
