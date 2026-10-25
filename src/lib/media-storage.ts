import { promises as fs } from "node:fs";
import path from "node:path";
import { dataDirectory } from "./data-path";
import { cloudClient, usesCloudStorage } from "./cloud";

type MediaKind = "product-media" | "private_proofs";
const bucket = (kind: MediaKind) => kind === "product-media" ? "artique-products" : "artique-proofs";

export async function saveMedia(kind: MediaKind, filename: string, bytes: Buffer) {
  if (usesCloudStorage()) {
    const client = cloudClient();
    if (client) {
      const { error } = await client.storage.from(bucket(kind)).upload(filename, bytes, { contentType: "image/webp", upsert: false });
      if (error) throw new Error(`Image upload failed: ${error.message}`);
      return;
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
      const { data, error } = await client.storage.from(bucket(kind)).download(filename);
      if (!error && data) {
        return Buffer.from(await data.arrayBuffer());
      }
    }
  }
  return fs.readFile(path.join(dataDirectory(), kind, filename));
}
