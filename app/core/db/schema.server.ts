import { and, isNotNull, or, sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  smallint,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const profiles = pgTable(
  "profiles",
  {
    userId: text("user_id").primaryKey(),
    timezone: text("timezone").notNull(),
    slotDurationMinutes: smallint("slot_duration_minutes")
      .notNull()
      .default(30),
  },

  (t) => [
    check(
      "profiles_slot_duration_check",
      sql`${t.slotDurationMinutes} > 0 AND ${t.slotDurationMinutes} <= 1440`,
    ),
  ],
);

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => profiles.userId, { onDelete: "cascade" }),
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

    durationMinutes: smallint("duration_minutes").notNull().default(30),
  },
  (t) => [
    index("services_user_id_idx").on(t.userId),
    check(
      "services_name_length_check",
      sql`char_length(${t.name}) > 0 AND char_length(${t.name}) <= 255`,
    ),
    check(
      "services_description_length_check",
      sql`char_length(${t.description}) <= 5000`,
    ),
    check(
      "services_duration_check",
      sql`${t.durationMinutes} > 0 AND ${t.durationMinutes} <= 1440`,
    ),
  ],
);

export const availabilities = pgTable(
  "availabilities",
  {
    userId: text("user_id")
      .notNull()
      .references(() => profiles.userId, { onDelete: "cascade" }),
    weekDay: smallint("week_day").notNull(), // 0 (Sunday) to 6 (Saturday)
    startTime: time("start_time", { precision: 0 }).notNull(),
    endTime: time("end_time", { precision: 0 }).notNull(),
  },
  (t) => [
    index("availabilities_user_id_idx").on(t.userId),
    check("availabilities_time_check", sql`${t.startTime} < ${t.endTime}`),
    check(
      "availabilities_weekday_check",
      sql`${t.weekDay} >= 0 AND ${t.weekDay} <= 6`,
    ),
  ],
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),

    providerUserId: text("provider_user_id")
      .notNull()
      .references(() => profiles.userId, { onDelete: "cascade" }),

    // User that made the booking. Can be null for guest bookings, but if present must reference a valid user.
    customerUserId: text("customer_user_id").references(() => profiles.userId, {
      onDelete: "cascade",
    }),

    // Information about the guest making the booking. Required if customerUserId is null.
    guestName: text("guest_name"),
    guestEmail: text("guest_email"),
    guestPhone: text("guest_phone"),

    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
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
    index("bookings_service_id_idx").on(t.serviceId),
    index("bookings_customer_user_id_idx").on(t.customerUserId),
    index("bookings_provider_user_id_idx").on(t.providerUserId),

    check("bookings_time_check", sql`${t.startTime} < ${t.endTime}`),
    check(
      "bookings_customer_info_check",
      sql`${or(
        isNotNull(t.customerUserId),
        and(
          isNotNull(t.guestName),
          or(isNotNull(t.guestEmail), isNotNull(t.guestPhone)),
        ),
      )}`,
    ),
  ],
);
