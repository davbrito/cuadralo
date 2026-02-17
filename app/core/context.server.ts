import type { SessionAuthObject } from "@clerk/react-router/server";
import { AsyncLocalStorage } from "node:async_hooks";
import type { DB } from "./db/index.server";

export interface CloudflareContext {
  env: Env;
  ctx: ExecutionContext;
}

export const CLOUDFLARE = createALSContext<CloudflareContext>("Cloudflare");
export const AUTH: AlsContext<
  Extract<SessionAuthObject, { isAuthenticated: true }>
> = createALSContext("Auth");
export const DATABASE = createALSContext<DB>("Database");

export interface AlsContext<T> {
  provide<Ret>(contextValue: T, fn: () => Ret): Ret;
  get(): T;
  bind(contextValue: T): { context: AlsContext<T>; value: T };
}

export interface AlsContextBound<T> {
  context: AlsContext<T>;
  value: T;
}

function createALSContext<T>(name: string): AlsContext<T> {
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
    bind(contextValue: T): AlsContextBound<T> {
      return { context: this, value: contextValue };
    },
  };
}

export function provide<Ret>(
  contexts: AlsContextBound<unknown>[],
  fn: () => Ret,
): Ret {
  const stack = [...contexts];

  function next(): Ret {
    if (stack.length === 0) {
      return fn();
    }

    const { context, value } = stack.shift()!;
    return context.provide(value, next);
  }

  return next();
}
