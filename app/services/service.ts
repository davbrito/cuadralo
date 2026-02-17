import { AUTH, DATABASE } from "@/core/context.server";
import { services } from "@/core/db/schema.server";
import { and, eq, isNull } from "drizzle-orm";

export type Service = Pick<
  typeof services.$inferSelect,
  "id" | "name" | "description" | "durationMinutes" | "createdAt"
>;

export async function listServices(
  providerId: string,
  page = 1,
  pageSize = 20,
): Promise<Service[]> {
  pageSize = Math.min(pageSize, 100);

  return await DATABASE.get().query.services.findMany({
    columns: {
      id: true,
      name: true,
      description: true,
      durationMinutes: true,
      createdAt: true,
    },
    where: {
      userId: providerId,
      deletedAt: { isNull: true },
    },
    orderBy: { createdAt: "asc" },
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
}

export async function createService(params: {
  name: string;
  description?: string | null;
  durationMinutes: number;
}) {
  const { name, description, durationMinutes } = params;
  const userId = AUTH.get().userId;

  return await DATABASE.get()
    .insert(services)
    .values({
      userId,
      name,
      description: description ?? "",
      durationMinutes,
    })
    .returning({ id: services.id });
}

export async function updateServiceDuration(params: {
  serviceId: string;
  durationMinutes: number;
}) {
  const { serviceId, durationMinutes } = params;
  const userId = AUTH.get().userId;

  return await DATABASE.get()
    .update(services)
    .set({ durationMinutes })
    .where(
      and(
        eq(services.id, serviceId),
        eq(services.userId, userId),
        isNull(services.deletedAt),
      ),
    )
    .returning({ id: services.id });
}
