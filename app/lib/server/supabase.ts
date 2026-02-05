import { CLOUDFLARE, SUPABASE } from "@/context";
import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
  type CookieMethodsServer,
} from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AsyncLocalStorage } from "node:async_hooks";
import type { MiddlewareFunction } from "react-router";
import type { Database } from "supabase.types";

export const supabaseContext = new AsyncLocalStorage<ServerSupabase>();

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
