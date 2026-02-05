import { createRequestHandler, RouterContextProvider } from "react-router";
import { cloudflareContext } from "@/context";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    const contextProvider = new RouterContextProvider();
    contextProvider.set(cloudflareContext, { env, ctx });
    return requestHandler(request, contextProvider);
  },
} satisfies ExportedHandler<Env>;
