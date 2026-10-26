import { promises as fs } from "node:fs";
import path from "node:path";
import { dataDirectory } from "./data-path";
import { cloudClient, usesCloudStorage } from "./cloud";

type MediaKind = "product-media" | "private_proofs";
const bucket = (kind: MediaKind) => kind === "product-media" ? "artique-products" : "artique-proofs";

function withTimeout<T>(promise: PromiseLike<T>, ms = 2500): Promise<T> {
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
  if (usesCloudStorage()) {
    const client = cloudClient();
    if (client) {
      try {
        const { error } = await withTimeout(
          client.storage.from(bucket(kind)).upload(filename, bytes, { contentType: "image/webp", upsert: false }),
          2500
        );
        if (!error) return;
        console.warn(`Cloud media upload warning (${error.message}), falling back to local storage.`);
      } catch (err) {
        console.warn("Cloud media upload failed, falling back to local storage:", err);
      }
    }
  }
  const directory = path.join(dataDirectory(), kind);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, filename), bytes);
}

export async function readMedia(kind: MediaKind, filename: string): Promise<Buffer> {
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
  return fs.readFile(path.join(dataDirectory(), kind, filename));
}
