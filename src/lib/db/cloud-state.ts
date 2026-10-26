import { AsyncLocalStorage } from "node:async_hooks";
import { cloudClient, neonClient, isUsingNeon } from "@/lib/cloud";

const transaction = new AsyncLocalStorage<{ revision?: number }>();
class Conflict extends Error {}

function withTimeout<T>(promise: PromiseLike<T>, ms = 2500): Promise<T> {
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
  // 1. Neon Serverless Postgres Mode
  if (isUsingNeon()) {
    const sql = neonClient();
    if (!sql) throw new Error("Cloud store unavailable: Neon database URL not configured");
    
    let rows = await withTimeout(
      sql`SELECT revision, payload FROM artique_state WHERE id = 'store' LIMIT 1;`,
      2500
    );

    if (rows.length === 0 && initial) {
      await withTimeout(
        sql`INSERT INTO artique_state (id, revision, payload) VALUES ('store', 1, ${JSON.stringify(initial)}::jsonb) ON CONFLICT (id) DO NOTHING;`,
        2500
      );
      rows = await withTimeout(
        sql`SELECT revision, payload FROM artique_state WHERE id = 'store' LIMIT 1;`,
        2500
      );
    }

    if (rows.length === 0) throw new Error("Cloud store is empty.");
    
    const data = rows[0] as { revision: number; payload: T };
    const context = transaction.getStore();
    if (context) context.revision = data.revision;
    return (typeof data.payload === "string" ? JSON.parse(data.payload) : data.payload) as T;
  }

  // 2. Fallback: Supabase Client Mode
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

  // 1. Neon Serverless Postgres Mode
  if (isUsingNeon()) {
    const sql = neonClient();
    if (!sql) throw new Error("Cloud store unavailable: Neon database URL not configured");

    const result = await withTimeout(
      sql`SELECT artique_compare_and_swap(${revision}, ${JSON.stringify(payload)}::jsonb) AS success;`,
      3000
    );

    const success = Boolean(result[0]?.success);
    if (!success) throw new Conflict();
    return;
  }

  // 2. Fallback: Supabase Client Mode
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
