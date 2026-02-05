import { CLOUDFLARE } from "@/context";
import { createRequestHandler, RouterContextProvider } from "react-router";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    const contextProvider = new RouterContextProvider();
    const cloudflare = { env, ctx };

    return CLOUDFLARE.provide(cloudflare, () => {
      return requestHandler(request, contextProvider);
    });
  },
} satisfies ExportedHandler<Env>;
