import { CLOUDFLARE, DATABASE, provide } from "@/core/context.server";
import { initDB } from "@/core/db/index.server";
import { createRequestHandler, RouterContextProvider } from "react-router";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    const contextProvider = new RouterContextProvider();
    const cloudflare = { env, ctx };
    const db = initDB();

    const response = await provide(
      [CLOUDFLARE.bind(cloudflare), DATABASE.bind(db)],
      () => requestHandler(request, contextProvider),
    );

    // ctx.waitUntil(db.$client.end());
    return response;
  },
} satisfies ExportedHandler<Env>;
