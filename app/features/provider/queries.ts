import { DATABASE } from "@/core/context.server";

export function getUserServices(providerId: string) {
  const db = DATABASE.get();

  return db.query.services.findMany({
    where: {
      userId: providerId,
      deletedAt: { isNull: true },
    },
    orderBy: { createdAt: "asc" },
  });
}
