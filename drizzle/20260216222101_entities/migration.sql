CREATE TABLE "availabilities" (
	"user_id" text NOT NULL,
	"week_day" smallint NOT NULL,
	"start_time" time(0) NOT NULL,
	"end_time" time(0) NOT NULL,
	CONSTRAINT "availabilities_time_check" CHECK ("start_time" < "end_time"),
	CONSTRAINT "availabilities_weekday_check" CHECK ("week_day" >= 0 AND "week_day" <= 6)
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"service_id" uuid NOT NULL,
	"provider_user_id" text NOT NULL,
	"customer_user_id" text,
	"guest_name" text,
	"guest_email" text,
	"guest_phone" text,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "bookings_time_check" CHECK ("start_time" < "end_time"),
	CONSTRAINT "bookings_customer_info_check" CHECK ((("customer_user_id" is not null) or (("guest_name" is not null) and (("guest_email" is not null) or ("guest_phone" is not null)))))
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY,
	"full_name" text NOT NULL,
	"timezone" text NOT NULL,
	"slot_duration_minutes" smallint DEFAULT 30 NOT NULL,
	CONSTRAINT "profiles_slot_duration_check" CHECK ("slot_duration_minutes" > 0 AND "slot_duration_minutes" <= 1440)
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"duration_minutes" smallint DEFAULT 30 NOT NULL,
	CONSTRAINT "services_name_length_check" CHECK (char_length("name") > 0 AND char_length("name") <= 255),
	CONSTRAINT "services_description_length_check" CHECK (char_length("description") <= 5000),
	CONSTRAINT "services_duration_check" CHECK ("duration_minutes" > 0 AND "duration_minutes" <= 1440)
);
--> statement-breakpoint
CREATE INDEX "availabilities_user_id_idx" ON "availabilities" ("user_id");--> statement-breakpoint
CREATE INDEX "bookings_service_id_idx" ON "bookings" ("service_id");--> statement-breakpoint
CREATE INDEX "bookings_customer_user_id_idx" ON "bookings" ("customer_user_id");--> statement-breakpoint
CREATE INDEX "bookings_provider_user_id_idx" ON "bookings" ("provider_user_id");--> statement-breakpoint
CREATE INDEX "services_user_id_idx" ON "services" ("user_id");--> statement-breakpoint
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_user_id_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_services_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_provider_user_id_profiles_user_id_fkey" FOREIGN KEY ("provider_user_id") REFERENCES "profiles"("user_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_user_id_profiles_user_id_fkey" FOREIGN KEY ("customer_user_id") REFERENCES "profiles"("user_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_user_id_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id") ON DELETE CASCADE;