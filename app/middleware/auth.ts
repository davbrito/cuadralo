import { SUPABASE, USER } from "@/context";
import { redirect, type MiddlewareFunction } from "react-router";

export const privateMiddleware: MiddlewareFunction<Response> = async (
  args,
  next,
) => {
  const supabase = SUPABASE.get();
  const response = await supabase.auth.getSession();

  if (!response.data.session) {
    throw redirect("/login");
  }

  return USER.provide(response.data.session.user, () => next());
};
