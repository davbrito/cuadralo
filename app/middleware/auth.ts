import { AUTH } from "@/core/context.server";
import { getAuth } from "@clerk/react-router/server";
import { redirect, type MiddlewareFunction } from "react-router";

export const privateMiddleware: MiddlewareFunction<Response> = async (
  args,
  next,
) => {
  const auth = await getAuth(args);

  if (!auth.isAuthenticated) {
    throw redirect("/sign-in");
  }

  return AUTH.provide(auth, () => next());
};
