import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import type {
  EntryContext,
  HandleErrorFunction,
  RouterContextProvider,
  unstable_InstrumentationHandlerResult,
  unstable_ServerInstrumentation,
} from "react-router";
import { ServerRouter } from "react-router";

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  contextProvider: RouterContextProvider,
) {
  let shellRendered = false;
  const userAgent = request.headers.get("user-agent");

  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      onError(error: unknown) {
        responseStatusCode = 500;
        // Log streaming rendering errors from inside the shell.  Don't log
        // errors encountered during initial shell rendering since they'll
        // reject and get logged in handleDocumentRequest.
        if (shellRendered) {
          console.error(error);
        }
      },
      signal: request.signal,
    },
  );
  shellRendered = true;

  // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
  // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
  if ((userAgent && isbot(userAgent)) || routerContext.isSpaMode) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

export const handleError: HandleErrorFunction = (error, { request }) => {
  if (!request.signal.aborted) {
    console.error(error);
  }
};

const logging: unstable_ServerInstrumentation = {
  handler({ instrument }) {
    instrument({
      request: (fn, { request }) => log(`request ${request.url}`, fn),
    });
  },
  route({ instrument, id }) {
    instrument({
      middleware: (fn) => log(` middleware (${id})`, fn),
      loader: (fn) => log(`  loader (${id})`, fn),
      action: (fn) => log(`  action (${id})`, fn),
    });
  },
};

async function log(
  label: string,
  cb: () => Promise<unstable_InstrumentationHandlerResult>,
) {
  const start = Date.now();
  console.log(`-> ${label}`);
  await cb();
  console.log(`<- ${label} (${Date.now() - start}ms)`);
}

export const unstable_instrumentations = [logging];
