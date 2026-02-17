import { DATABASE } from "@/core/context.server";
import { availabilities, bookings, services } from "@/core/db/schema.server";
import { and, eq, gt, gte, isNull, lt } from "drizzle-orm";

function parseDateOnly(date: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function getDayBoundsUTC(date: string): { start: Date; end: Date } | null {
  const parsed = parseDateOnly(date);
  if (!parsed) {
    return null;
  }

  const start = new Date(parsed);
  const end = new Date(parsed);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

function getWeekdayUTC(date: string): number | null {
  const parsed = parseDateOnly(date);
  if (!parsed) {
    return null;
  }

  return parsed.getUTCDay();
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  return hours * 60 + minutes;
}

function createUtcDateAtMinutes(date: string, minutes: number): Date {
  const [year, month, day] = date.split("-").map(Number);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return new Date(Date.UTC(year, month - 1, day, hours, mins, 0, 0));
}

export async function listAvailableSlots(params: {
  userId: string;
  serviceId: string;
  date: string;
}): Promise<string[]> {
  const { userId, serviceId, date } = params;
  const db = DATABASE.get();

  const dayBounds = getDayBoundsUTC(date);
  const weekDay = getWeekdayUTC(date);

  if (!dayBounds || weekDay === null) {
    return [];
  }

  const service = await db
    .select({
      id: services.id,
      durationMinutes: services.durationMinutes,
    })
    .from(services)
    .where(
      and(
        eq(services.id, serviceId),
        eq(services.userId, userId),
        isNull(services.deletedAt),
      ),
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!service) {
    return [];
  }

  const [availabilityRows, bookingRows] = await Promise.all([
    db
      .select({
        startTime: availabilities.startTime,
        endTime: availabilities.endTime,
      })
      .from(availabilities)
      .where(
        and(
          eq(availabilities.userId, userId),
          eq(availabilities.weekDay, weekDay),
        ),
      ),
    db
      .select({
        startTime: bookings.startTime,
        endTime: bookings.endTime,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.providerUserId, userId),
          isNull(bookings.deletedAt),
          gte(bookings.startTime, dayBounds.start),
          lt(bookings.startTime, dayBounds.end),
        ),
      ),
  ]);

  const now = Date.now();
  const slots: string[] = [];

  for (const availability of availabilityRows) {
    const windowStart = timeToMinutes(availability.startTime);
    const windowEnd = timeToMinutes(availability.endTime);

    for (
      let cursor = windowStart;
      cursor + service.durationMinutes <= windowEnd;
      cursor += service.durationMinutes
    ) {
      const start = createUtcDateAtMinutes(date, cursor);
      const end = new Date(start);
      end.setUTCMinutes(end.getUTCMinutes() + service.durationMinutes);

      if (start.getTime() <= now) {
        continue;
      }

      const overlaps = bookingRows.some(
        (booking) => start < booking.endTime && end > booking.startTime,
      );

      if (!overlaps) {
        slots.push(start.toISOString());
      }
    }
  }

  slots.sort((a, b) => a.localeCompare(b));

  return slots;
}

export async function createGuestBooking(params: {
  userId: string;
  serviceId: string;
  startAtIso: string;
  guestName: string;
  guestEmail: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const { userId, serviceId, startAtIso, guestName, guestEmail } = params;
  const db = DATABASE.get();

  const startTime = new Date(startAtIso);
  if (Number.isNaN(startTime.getTime())) {
    return { ok: false, message: "El slot seleccionado no es válido." };
  }

  if (startTime.getTime() <= Date.now()) {
    return { ok: false, message: "No puedes reservar un horario pasado." };
  }

  const service = await db
    .select({
      id: services.id,
      durationMinutes: services.durationMinutes,
      userId: services.userId,
    })
    .from(services)
    .where(
      and(
        eq(services.id, serviceId),
        eq(services.userId, userId),
        isNull(services.deletedAt),
      ),
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!service) {
    return { ok: false, message: "El servicio seleccionado no existe." };
  }

  const date = startAtIso.slice(0, 10);
  const validSlots = await listAvailableSlots({ userId, serviceId, date });

  if (!validSlots.includes(startAtIso)) {
    return {
      ok: false,
      message: "Ese horario ya no está disponible. Elige otro slot.",
    };
  }

  const endTime = new Date(startTime);
  endTime.setUTCMinutes(endTime.getUTCMinutes() + service.durationMinutes);

  const overlapping = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.providerUserId, userId),
        isNull(bookings.deletedAt),
        lt(bookings.startTime, endTime),
        gt(bookings.endTime, startTime),
      ),
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (overlapping) {
    return {
      ok: false,
      message: "Ese horario acaba de ser tomado. Elige otro slot.",
    };
  }

  await db.insert(bookings).values({
    serviceId: service.id,
    providerUserId: userId,
    guestName,
    guestEmail,
    startTime,
    endTime,
  });

  return { ok: true };
}
