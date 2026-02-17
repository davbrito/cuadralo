// Create a type for the Roles
export type Roles = "admin" | "provider";

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles;
    };
  }
}
