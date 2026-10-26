import { promises as fs } from "node:fs";
import path from "node:path";
import { dataDirectory } from "./data-path";
import { cloudClient, usesCloudStorage, isUsingNeon, neonClient } from "./cloud";

type MediaKind = "product-media" | "private_proofs";
const bucket = (kind: MediaKind) => kind === "product-media" ? "artique-products" : "artique-proofs";

function withTimeout<T>(promise: PromiseLike<T>, ms = 3000): Promise<T> {
  let timer: NodeJS.Timeout;
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error("Cloud media timeout")), ms);
    }),
  ]).finally(() => {
    clearTimeout(timer);
  });
}

export async function saveMedia(kind: MediaKind, filename: string, bytes: Buffer) {
  // 1. Neon Serverless Postgres storage
  if (isUsingNeon()) {
    const sql = neonClient();
    if (sql) {
      try {
        const hex = "\\x" + bytes.toString("hex");
        await withTimeout(
          sql`
            INSERT INTO artique_media (kind, filename, content)
            VALUES (${kind}, ${filename}, ${hex}::bytea)
            ON CONFLICT (kind, filename)
            DO UPDATE SET content = EXCLUDED.content;
          `,
          3500
        );
        return;
      } catch (err) {
        console.warn("Neon media upload failed, falling back to local storage:", err);
      }
    }
  }

  // 2. Supabase Storage fallback
  if (usesCloudStorage()) {
    const client = cloudClient();
    if (client) {
      try {
        const { error } = await withTimeout(
          client.storage.from(bucket(kind)).upload(filename, bytes, { contentType: "image/webp", upsert: true }),
          2500
        );
        if (!error) return;
        console.warn(`Cloud media upload warning (${error.message}), falling back to local storage.`);
      } catch (err) {
        console.warn("Cloud media upload failed, falling back to local storage:", err);
      }
    }
  }

  // 3. Local filesystem fallback
  const directory = path.join(dataDirectory(), kind);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, filename), bytes);
}

export async function readMedia(kind: MediaKind, filename: string): Promise<Buffer> {
  // 1. Neon Serverless Postgres storage
  if (isUsingNeon()) {
    const sql = neonClient();
    if (sql) {
      try {
        const rows = await withTimeout(
          sql`SELECT encode(content, 'hex') AS hex FROM artique_media WHERE kind = ${kind} AND filename = ${filename} LIMIT 1;`,
          2500
        );
        if (rows.length > 0 && rows[0].hex) {
          return Buffer.from(rows[0].hex, "hex");
        }
      } catch (err) {
        console.warn("Neon media read failed, falling back:", err);
      }
    }
  }

  // 2. Supabase Storage fallback
  if (usesCloudStorage()) {
    const client = cloudClient();
    if (client) {
      try {
        const { data, error } = await withTimeout(
          client.storage.from(bucket(kind)).download(filename),
          2000
        );
        if (!error && data) {
          return Buffer.from(await data.arrayBuffer());
        }
      } catch {
        // Fall through to local storage
      }
    }
  }

  // 3. Local filesystem fallback
  return fs.readFile(path.join(dataDirectory(), kind, filename));
}
