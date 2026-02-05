import { eq, sql } from "drizzle-orm";
import {
  check,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid, authUsers } from "drizzle-orm/supabase";

export const services = pgTable.withRLS(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" })
      .default(sql`auth.uid()`),
    name: text("name").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    pgPolicy("services_select_user_policy", {
      for: "select",
      to: authenticatedRole,
      using: eq(authUid, t.userId),
    }),
    pgPolicy("services_insert_user_policy", {
      for: "insert",
      to: authenticatedRole,
      withCheck: eq(authUid, t.userId),
    }),
    pgPolicy("services_update_user_policy", {
      for: "update",
      to: authenticatedRole,
      using: eq(authUid, t.userId),
      withCheck: eq(authUid, t.userId),
    }),
    pgPolicy("services_delete_user_policy", {
      for: "delete",
      to: authenticatedRole,
      using: eq(authUid, t.userId),
    }),
    check(
      "services_name_length_check",
      sql`char_length(${t.name}) > 0 AND char_length(${t.name}) <= 255`,
    ),
    check(
      "services_description_length_check5000",
      sql`char_length(${t.description}) <= 5000`,
    ),
  ],
);
