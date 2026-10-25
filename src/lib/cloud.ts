import { createClient } from "@supabase/supabase-js";

export function hasCloudCredentials(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function usesCloudStorage(): boolean {
  if (process.env.ARTIQUE_STORAGE === "local") return false;
  return (
    process.env.ARTIQUE_STORAGE === "supabase" ||
    (process.env.VERCEL === "1" && hasCloudCredentials())
  );
}

export function cloudClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
