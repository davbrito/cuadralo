import { getClerkClient } from "@/core/auth";
import { DATABASE } from "@/core/context.server";
import { bookings, profiles, services } from "@/core/db/schema.server";
import { listAvailableSlots } from "@/services/reservation";
import { and, eq, isNull } from "drizzle-orm";

type PublicService = Pick<
  typeof services.$inferSelect,
  "id" | "name" | "description" | "durationMinutes"
>;

export interface PublicReserveData {
  provider: {
    userId: string;
    displayName: string;
    timezone: string;
    serviceCount: number;
    imageUrl: string | null;
  };
  services: PublicService[];
  selectedService: PublicService | null;
  slots: string[];
}

export interface PublicBookingDetailData {
  provider: PublicReserveData["provider"];
  booking: {
    id: string;
    startTime: Date;
    endTime: Date;
    createdAt: Date;
    guestName: string | null;
    guestEmail: string | null;
    service: PublicService;
  };
}

export async function getPublicReserveData(params: {
  userId: string;
  serviceId?: string | null;
  date: string;
}): Promise<PublicReserveData> {
  const { userId, serviceId, date } = params;
  const db = DATABASE.get();

  const userServices = await db
    .select({
      id: services.id,
      name: services.name,
      description: services.description,
      durationMinutes: services.durationMinutes,
    })
    .from(services)
    .where(and(eq(services.userId, userId), isNull(services.deletedAt)))
    .orderBy(services.createdAt);

  const profile = await db
    .select({
      timezone: profiles.timezone,
    })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  const clerk = getClerkClient();
  const providerUser = await clerk.users.getUser(userId);

  const provider = {
    userId,
    imageUrl: providerUser.imageUrl,
    displayName:
      `${providerUser.firstName ?? ""} ${providerUser.lastName ?? ""}`.trim(),
    timezone: profile?.timezone,
    serviceCount: userServices.length,
  };

  const selectedService =
    userServices.find((service) => service.id === serviceId) ??
    userServices[0] ??
    null;

  if (!selectedService) {
    return {
      provider,
      services: userServices,
      selectedService: null,
      slots: [],
    };
  }

  const slots = await listAvailableSlots({
    userId,
    serviceId: selectedService.id,
    date,
    timezone: profile.timezone,
  });

  return {
    provider,
    services: userServices,
    selectedService,
    slots,
  };
}

export async function getPublicBookingDetail(params: {
  userId: string;
  bookingId: string;
}): Promise<PublicBookingDetailData | null> {
  const { userId, bookingId } = params;
  const db = DATABASE.get();

  const [profile, bookingRow] = await Promise.all([
    db
      .select({
        timezone: profiles.timezone,
      })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1)
      .then((rows) => rows.at(0) ?? null),
    db
      .select({
        bookingId: bookings.id,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        createdAt: bookings.createdAt,
        guestName: bookings.guestName,
        guestEmail: bookings.guestEmail,
        serviceId: services.id,
        serviceName: services.name,
        serviceDescription: services.description,
        serviceDurationMinutes: services.durationMinutes,
      })
      .from(bookings)
      .innerJoin(services, eq(services.id, bookings.serviceId))
      .where(
        and(
          eq(bookings.id, bookingId),
          eq(bookings.providerUserId, userId),
          isNull(bookings.deletedAt),
          isNull(services.deletedAt),
        ),
      )
      .limit(1)
      .then((rows) => rows.at(0) ?? null),
  ]);

  if (!profile || !bookingRow) {
    return null;
  }

  const clerk = getClerkClient();
  const providerUser = await clerk.users.getUser(userId);

  const provider = {
    userId,
    imageUrl: providerUser.imageUrl,
    displayName:
      `${providerUser.firstName ?? ""} ${providerUser.lastName ?? ""}`.trim() ||
      "Provider",
    timezone: profile.timezone,
    serviceCount: 1,
  };

  return {
    provider,
    booking: {
      id: bookingRow.bookingId,
      startTime: bookingRow.startTime,
      endTime: bookingRow.endTime,
      createdAt: bookingRow.createdAt,
      guestName: bookingRow.guestName,
      guestEmail: bookingRow.guestEmail,
      service: {
        id: bookingRow.serviceId,
        name: bookingRow.serviceName,
        description: bookingRow.serviceDescription,
        durationMinutes: bookingRow.serviceDurationMinutes,
      },
    },
  };
}
