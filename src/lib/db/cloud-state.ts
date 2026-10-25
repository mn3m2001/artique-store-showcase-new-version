import { AsyncLocalStorage } from "node:async_hooks";
import { cloudClient } from "@/lib/cloud";

const transaction = new AsyncLocalStorage<{ revision?: number }>();
class Conflict extends Error {}

export async function readCloudState<T>(initial?: T): Promise<T> {
  const client = cloudClient();
  if (!client) throw new Error("Cloud store unavailable: Supabase client not configured");
  let { data, error } = await client.from("artique_state").select("revision,payload").eq("id", "store").single();
  if (error?.code === "PGRST116" && initial) {
    const seeded = await client.from("artique_state").upsert({ id: "store", revision: 1, payload: initial }, { onConflict: "id", ignoreDuplicates: true });
    if (seeded.error) throw new Error(`Cloud initialization failed: ${seeded.error.message}`);
    ({ data, error } = await client.from("artique_state").select("revision,payload").eq("id", "store").single());
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
  const { data, error } = await client.rpc("artique_compare_and_swap", { expected_revision: revision, next_payload: payload });
  if (error) throw new Error(`Cloud save failed: ${error.message}`);
  if (!data) throw new Conflict();
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
