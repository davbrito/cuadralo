import {
  parseCookieHeader,
  serializeCookieHeader,
  type CookieMethodsServer,
} from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "supabase.types";

export type ServerSupabase = SupabaseClient<Database>;

export function makeCookieMethods(request: Request): CookieMethodsServer & {
  applyToResponseHeaders(headers: Headers): void;
} {
  let pending: string[] | null = null;

  return {
    getAll() {
      return parseCookieHeader(request.headers.get("Cookie") ?? "") as Array<{
        name: string;
        value: string;
      }>;
    },
    setAll(cookies) {
      pending ??= [];

      for (const cookie of cookies) {
        pending.push(
          serializeCookieHeader(cookie.name, cookie.value, cookie.options),
        );
      }
    },
    applyToResponseHeaders(headers) {
      if (!pending) return;

      for (const cookie of pending) {
        headers.append("Set-Cookie", cookie);
      }

      pending = null;
    },
  };
}

export interface BrowserSupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export function getSupabaseClientConfig(env: Env): BrowserSupabaseConfig {
  return {
    supabaseUrl: env.SUPABASE_URL,
    supabaseAnonKey: env.SUPABASE_ANON_KEY,
  };
}
