import { AUTH, DATABASE } from "@/core/context.server";
import { availabilities, profiles } from "@/core/db/schema.server";
import { eq } from "drizzle-orm";

export type ProviderProfileSettings = Pick<
  typeof profiles.$inferSelect,
  "timezone" | "slotDurationMinutes"
> & {
  availabilities: ProviderAvailability[];
};

export type ProviderAvailability = Pick<
  typeof availabilities.$inferSelect,
  "weekDay" | "startTime" | "endTime"
>;

export async function getProviderProfileSettings(): Promise<ProviderProfileSettings> {
  const userId = AUTH.get().userId;
  const db = DATABASE.get();

  const profile = await db.query.profiles.findFirst({
    columns: {
      timezone: true,
      slotDurationMinutes: true,
    },
    where: { userId },
  });

  if (!profile) {
    throw new Error("No se encontró el perfil del provider.");
  }

  const rows = await db
    .select({
      weekDay: availabilities.weekDay,
      startTime: availabilities.startTime,
      endTime: availabilities.endTime,
    })
    .from(availabilities)
    .where(eq(availabilities.userId, userId));

  return {
    ...profile,
    availabilities: rows,
  };
}

export async function updateProviderProfileSettings(params: {
  timezone: string;
  slotDurationMinutes: number;
  availabilities: ProviderAvailability[];
}) {
  const userId = AUTH.get().userId;
  const db = DATABASE.get();

  const updated = await db
    .update(profiles)
    .set({
      timezone: params.timezone,
      slotDurationMinutes: params.slotDurationMinutes,
    })
    .where(eq(profiles.userId, userId))
    .returning({ userId: profiles.userId });

  await db.delete(availabilities).where(eq(availabilities.userId, userId));

  if (params.availabilities.length > 0) {
    await db.insert(availabilities).values(
      params.availabilities.map((availability) => ({
        userId,
        weekDay: availability.weekDay,
        startTime: availability.startTime,
        endTime: availability.endTime,
      })),
    );
  }

  return updated;
}
