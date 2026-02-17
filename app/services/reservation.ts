import { DATABASE } from "@/core/context.server";
import {
  availabilities,
  bookings,
  profiles,
  services,
} from "@/core/db/schema.server";
import { and, eq, gt, isNull, lt, sql } from "drizzle-orm";
import { DateTime } from "luxon";

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  return hours * 60 + minutes;
}

export async function listAvailableSlots(params: {
  userId: string;
  serviceId: string;
  date: string;
  timezone: string;
}): Promise<string[]> {
  const { userId, serviceId, date, timezone } = params;
  const db = DATABASE.get();

  const dt = DateTime.fromISO(date, { zone: timezone });
  if (!dt.isValid) {
    return [];
  }

  const dayBounds = { start: dt.startOf("day"), end: dt.endOf("day") };
  console.log("Day bounds:", dayBounds.start.toISO(), dayBounds.end.toISO());
  const weekDay = dt.weekday % 7; // Convertir a formato 0 (domingo) - 6 (sábado)

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
    .then((rows) => rows.at(0));

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
          sql`${bookings.startTime} BETWEEN ${dayBounds.start.toJSDate()} AND ${dayBounds.end.toJSDate()}`,
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
      const start = dt.set({
        hour: Math.floor(cursor / 60),
        minute: cursor % 60,
        second: 0,
        millisecond: 0,
      });
      const end = start.plus({ minutes: service.durationMinutes });

      if (+start <= now) {
        continue;
      }

      const overlaps = bookingRows.some(
        (booking) => +start < +booking.endTime && +end > +booking.startTime,
      );

      if (!overlaps) {
        slots.push(start.toISO());
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
}): Promise<{ ok: true; bookingId: string } | { ok: false; message: string }> {
  const { userId, serviceId, startAtIso, guestName, guestEmail } = params;
  const db = DATABASE.get();

  const startTime = new Date(startAtIso);
  if (Number.isNaN(startTime.getTime())) {
    return { ok: false, message: "El slot seleccionado no es válido." };
  }

  if (startTime.getTime() <= Date.now()) {
    return { ok: false, message: "No puedes reservar un horario pasado." };
  }

  const profile = await db
    .select({
      timezone: profiles.timezone,
    })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1)
    .then((rows) => rows.at(0));

  if (!profile) {
    return {
      ok: false,
      message: "El proveedor no tiene un perfil configurado.",
    };
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
    .then((rows) => rows.at(0));

  if (!service) {
    return { ok: false, message: "El servicio seleccionado no existe." };
  }

  const date = startAtIso.slice(0, 10);
  const validSlots = await listAvailableSlots({
    userId,
    serviceId,
    date,
    timezone: profile.timezone,
  });

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

  const createdBooking = await db
    .insert(bookings)
    .values({
      serviceId: service.id,
      providerUserId: userId,
      guestName,
      guestEmail,
      startTime,
      endTime,
    })
    .returning({ id: bookings.id })
    .then((rows) => rows.at(0));

  if (!createdBooking) {
    return { ok: false, message: "No se pudo crear la reserva." };
  }

  return { ok: true, bookingId: createdBooking.id };
}
