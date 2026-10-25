import path from "node:path";
import os from "node:os";

export function dataDirectory() {
  if (process.env.ARTIQUE_DATA_DIR) {
    return process.env.ARTIQUE_DATA_DIR;
  }
  if (process.env.VERCEL === "1") {
    return path.join(os.tmpdir(), "artique-data");
  }
  return path.join(process.cwd(), ".demo-data");
}
