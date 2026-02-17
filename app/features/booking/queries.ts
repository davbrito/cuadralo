import { DATABASE } from "@/core/context.server";
import { services } from "@/core/db/schema.server";
import { listAvailableSlots } from "@/services/reservation";
import { and, eq, isNull } from "drizzle-orm";

type PublicService = Pick<
  typeof services.$inferSelect,
  "id" | "name" | "description" | "durationMinutes"
>;

export interface PublicReserveData {
  services: PublicService[];
  selectedService: PublicService | null;
  slots: string[];
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

  const selectedService =
    userServices.find((service) => service.id === serviceId) ??
    userServices[0] ??
    null;

  if (!selectedService) {
    return { services: userServices, selectedService: null, slots: [] };
  }

  const slots = await listAvailableSlots({
    userId,
    serviceId: selectedService.id,
    date,
  });

  return {
    services: userServices,
    selectedService,
    slots,
  };
}
