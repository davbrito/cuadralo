import type { ServerSupabase } from "@/lib/server/supabase.server";
import type { User } from "@supabase/supabase-js";
import { AsyncLocalStorage } from "node:async_hooks";

export interface CloudflareContext {
  env: Env;
  ctx: ExecutionContext;
}

export const CLOUDFLARE = createALSContext<CloudflareContext>("Cloudflare");
export const SUPABASE = createALSContext<ServerSupabase>("Supabase");
export const USER = createALSContext<User>("User");

function createALSContext<T>(name: string) {
  const als = new AsyncLocalStorage<T>();

  return {
    provide<Ret>(contextValue: T, fn: () => Ret): Ret {
      return als.run(contextValue, fn);
    },
    get(): T {
      const context = als.getStore();
      if (!context) {
        throw new Error(`${name} context is not available`);
      }
      return context;
    },
  };
}
