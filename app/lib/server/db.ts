import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
  type CookieMethodsServer,
} from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createContext,
  RouterContextProvider,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import type { Database } from "supabase.types";
import { cloudflareContext } from "@/context";

const pendingCookiesContext = createContext<string[] | null>(null);

export const supabaseContext = createContext<ServerSupabase | null>(null);

export type ServerSupabase = SupabaseClient<Database>;

export function getServerSupabase(
  args: LoaderFunctionArgs | ActionFunctionArgs,
): ServerSupabase {
  const { request, context } = args;

  let client = context.get(supabaseContext);
  if (client) return client;

  const cloudflare = context.get(cloudflareContext);
  const env = cloudflare.env;
  client = createServerClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      cookies: makeCookieMethods(context, request),
    },
  );
  context.set(supabaseContext, client);
  return client;
}

function makeCookieMethods(
  context: Readonly<RouterContextProvider>,
  request: Request,
): CookieMethodsServer {
  return {
    getAll() {
      return parseCookieHeader(request.headers.get("Cookie") ?? "") as Array<{
        name: string;
        value: string;
      }>;
    },
    setAll(cookies) {
      const pending = context.get(pendingCookiesContext) ?? [];

      for (const cookie of cookies) {
        pending.push(
          serializeCookieHeader(cookie.name, cookie.value, cookie.options),
        );
      }

      context.set(pendingCookiesContext, pending);
    },
  };
}

export function applySupabaseCookies(
  context: Readonly<RouterContextProvider>,
  responseHeaders: Headers,
) {
  const pending = context.get(pendingCookiesContext);

  if (!pending) return;

  for (const cookie of pending) {
    responseHeaders.append("Set-Cookie", cookie);
  }

  context.set(pendingCookiesContext, null);
}
