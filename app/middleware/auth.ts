import { getSession } from "@/lib/server/session";
import { redirect, type MiddlewareFunction } from "react-router";

export const authMiddleware = async ({ request }: { request: Request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  console.log("session data", session.data);

  if (!userId) {
    throw redirect("/login");
  }
};
