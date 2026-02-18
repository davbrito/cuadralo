import { getClerkClient } from "@/core/auth";
import { DATABASE } from "@/core/context.server";
import type { profiles } from "@/core/db/schema.server";

export async function getUserById(userId: string) {
  const db = DATABASE.get();
  const clerk = getClerkClient();

  const providerUserPromise = clerk.users.getUser(userId);
  const profilePromise = db.query.profiles.findFirst({ where: { userId } });
  const [providerUser, profile] = await Promise.all([
    providerUserPromise,
    profilePromise,
  ]);

  if (!profile) {
    throw new Error("El usuario no tiene un perfil configurado.");
  }

  return {
    userId,
    imageUrl: providerUser.imageUrl,
    displayName:
      `${providerUser.firstName ?? ""} ${providerUser.lastName ?? ""}`.trim(),
    profile,
  };
}

export interface UserDto {
  userId: string;
  imageUrl: string | null;
  displayName: string;
  profile: typeof profiles.$inferSelect;
}
