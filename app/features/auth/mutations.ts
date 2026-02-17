import { DATABASE } from "@/core/context.server";
import { profiles } from "@/core/db/schema.server";

export async function ensureProfile(userId: string) {
  const db = DATABASE.get();

  // TODO: Implement webhooks to create profiles on user creation instead of doing it lazily here
  await db
    .insert(profiles)
    .values({ userId, timezone: "America/Caracas", slotDurationMinutes: 30 })
    .onConflictDoNothing({ target: profiles.userId });
}
