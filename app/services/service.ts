import { AUTH, DATABASE } from "@/core/context.server";
import { services } from "@/core/db/schema.server";

export type Service = Pick<
  typeof services.$inferSelect,
  "id" | "name" | "description" | "createdAt"
>;

export async function listServices(
  page = 1,
  pageSize = 20,
): Promise<Service[]> {
  pageSize = Math.min(pageSize, 100);
  return await DATABASE.get().query.services.findMany({
    columns: { id: true, name: true, description: true, createdAt: true },
    where: { deletedAt: { isNull: true } },
    orderBy: { createdAt: "asc" },
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
}

export async function createService(params: {
  name: string;
  description?: string | null;
}) {
  const { name, description } = params;
  const userId = AUTH.get().userId;
  return await DATABASE.get()
    .insert(services)
    .values({ userId, name, description: description ?? "" })
    .returning({ id: services.id });
}
