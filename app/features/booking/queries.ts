import { DATABASE } from "@/core/context.server";
import { bookings, services } from "@/core/db/schema.server";
import { listAvailableSlots } from "@/features/booking/reservation";
import { and, eq, isNull } from "drizzle-orm";
import { getUserById, type UserDto } from "../auth/queries";

export type PublicService = Pick<
  typeof services.$inferSelect,
  "id" | "name" | "description" | "durationMinutes"
>;

export interface PublicReserveData {
  provider: UserDto;
  services: PublicService[];
  selectedService: PublicService | null;
  slots: string[];
}

export interface PublicBookingDetailData {
  provider: UserDto;
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

  const provider = await getUserById(userId);

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
    timezone: provider.profile.timezone,
  });

  return {
    provider,
    services: userServices,
    selectedService,
    slots,
  };
}

export async function getPublicBookingDetail(
  bookingId: string,
): Promise<PublicBookingDetailData | null> {
  const db = DATABASE.get();

  const bookingRow = await db
    .select({
      bookingId: bookings.id,
      providerUserId: bookings.providerUserId,
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
        isNull(bookings.deletedAt),
        isNull(services.deletedAt),
      ),
    )
    .limit(1)
    .then((rows) => rows.at(0) ?? null);

  if (!bookingRow) return null;

  const provider = await getUserById(bookingRow.providerUserId);

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
