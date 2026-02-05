import { SUPABASE } from "@/context";
import { flashStorage } from "@/lib/server/session";
import { redirect } from "react-router";

export async function action(args: { request: Request }) {
  console.log("logout action");
  const { request } = args;
  const session = await flashStorage.getSession(request.headers.get("Cookie"));
  const supabase = SUPABASE.get();
  const result = await supabase.auth.signOut();

  if (result.error) {
    session.flash("error", result.error.message);
    return redirect("/", {
      headers: {
        "Set-Cookie": await flashStorage.commitSession(session),
      },
    });
  }

  session.flash("success", "Logged out successfully");

  return redirect("/login", {
    headers: {
      "Set-Cookie": await flashStorage.commitSession(session),
    },
  });
}

export async function loader() {
  return redirect("/");
}
