import { CLOUDFLARE, SUPABASE } from "@/context";
import { makeCookieMethods } from "@/lib/server/supabase";
import { createServerClient } from "@supabase/ssr";
import type { MiddlewareFunction } from "react-router";
import type { Database } from "supabase.types";

export const supabaseMiddleware: MiddlewareFunction<Response> = async (
  { request },
  next,
) => {
  const { env } = CLOUDFLARE.get();
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;
  const cookies = makeCookieMethods(request);
  const supabase = createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    { cookies },
  );

  const response = await SUPABASE.provide(supabase, () => next());

  cookies.applyToResponseHeaders(response.headers);

  return response;
};
