import { createClient } from "@supabase/supabase-js";
import { neon } from "@neondatabase/serverless";

export function getDatabaseUrl(): string | null {
  return process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || null;
}

export function hasCloudCredentials(): boolean {
  return Boolean(
    getDatabaseUrl() ||
    (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

export function usesCloudStorage(): boolean {
  if (process.env.ARTIQUE_STORAGE === "local") return false;
  return (
    process.env.ARTIQUE_STORAGE === "supabase" ||
    process.env.ARTIQUE_STORAGE === "neon" ||
    (process.env.VERCEL === "1" && hasCloudCredentials())
  );
}

export function isUsingNeon(): boolean {
  return Boolean(getDatabaseUrl());
}

export function neonClient() {
  const url = getDatabaseUrl();
  if (!url) return null;
  return neon(url);
}

export function cloudClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
