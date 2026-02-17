import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/neon-serverless";
import { relations } from "./relations.server";
import * as schema from "./schema.server";

export function initDB() {
  console.log("Initializing database connection...");
  return drizzle(env.DATABASE_URL, { schema, relations });
}

export type DB = ReturnType<typeof initDB>;
