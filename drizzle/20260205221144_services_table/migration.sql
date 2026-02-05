CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "services" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "services_select_user_policy" ON "services" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "services"."user_id");--> statement-breakpoint
CREATE POLICY "services_insert_user_policy" ON "services" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "services"."user_id");--> statement-breakpoint
CREATE POLICY "services_update_user_policy" ON "services" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "services"."user_id") WITH CHECK ((select auth.uid()) = "services"."user_id");--> statement-breakpoint
CREATE POLICY "services_delete_user_policy" ON "services" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "services"."user_id");