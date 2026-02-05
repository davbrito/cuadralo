import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "supabase.types";
import type { BrowserSupabaseConfig } from "../server/supabase.server";

let client: SupabaseClient<Database> | null = null;

export function setupSupabaseClient(
  config: BrowserSupabaseConfig,
): SupabaseClient<Database> {
  client ||= createBrowserClient<Database>(
    config.supabaseUrl,
    config.supabaseAnonKey,
  );
  return client;
}

export function getBrowserSupabase() {
  if (!client) {
    throw new Error("Supabase client has not been initialized");
  }
  return client;
}
