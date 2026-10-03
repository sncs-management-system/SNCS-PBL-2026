import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let publicClient: SupabaseClient | undefined;

export function getPublicSupabaseClient(): SupabaseClient {
  if (publicClient) return publicClient;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (typeof url !== "string" || !/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url)
    || typeof key !== "string" || !key.startsWith("sb_publishable_")) {
    throw new Error("Public resource configuration is unavailable.");
  }
  publicClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return publicClient;
}
