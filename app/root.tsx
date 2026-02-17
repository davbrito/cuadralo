import "./app.css";

import { esMX } from "@clerk/localizations";
import { ClerkProvider } from "@clerk/react-router";
import { clerkMiddleware, rootAuthLoader } from "@clerk/react-router/server";
import { env } from "cloudflare:workers";
import type { ClerkMiddlewareOptions } from "node_modules/@clerk/react-router/dist/server/types";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";
import { Toaster } from "./components/ui/sonner";

const clerkOptions: ClerkMiddlewareOptions = {
  secretKey: env.CLERK_SECRET_KEY,
  publishableKey: env.CLERK_PUBLISHABLE_KEY,
};

export const middleware: Route.MiddlewareFunction[] = [
  clerkMiddleware(clerkOptions),
];

export const loader = (args: Route.LoaderArgs) =>
  rootAuthLoader(args, clerkOptions);

const TITLE = "Cuádralo";
const META_DESCRIPTION =
  "Cuádralo - Una plataforma para gestionar tus citas con clientes de manera eficiente y sencilla.";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>{TITLE}</title>
        <meta name="description" content={META_DESCRIPTION} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
        />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <Toaster />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App(props: Route.ComponentProps) {
  return (
    <>
      <ClerkProvider loaderData={props.loaderData} localization={esMX}>
        <Outlet />
      </ClerkProvider>
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
