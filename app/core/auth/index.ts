import { createClerkClient } from "@clerk/react-router/server";
import { env } from "cloudflare:workers";

// Create a type for the Roles
export type Roles = "admin" | "provider";

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles;
    };
  }
}

export function getClerkClient() {
  return createClerkClient({
    secretKey: env.CLERK_SECRET_KEY,
    publishableKey: env.CLERK_PUBLISHABLE_KEY,
  });
}
