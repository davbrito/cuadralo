import { defineRelations } from "drizzle-orm";
import * as schema from "./schema.server";

export const relations = defineRelations(schema, (r) => ({
  services: {
    user: r.one.profiles({
      from: r.services.userId,
      to: r.profiles.userId,
    }),
  },
}));
