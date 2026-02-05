import { LoginForm } from "#components/login-form";
import { getServerSupabase } from "@/lib/server/db";
import { commitSession, getSession } from "@/lib/server/session";
import { data, redirect } from "react-router";
import type { Route } from "./+types/login";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  console.log("loader session data", session.data);

  if (session.has("userId")) return redirect("/");

  return data(
    { error: session.get("error") },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    },
  );
}

export async function action(args: Route.ActionArgs) {
  const { request } = args;
  const session = await getSession(request.headers.get("Cookie"));

  const formData = await request.formData();
  console.log(Object.fromEntries(formData.entries()));
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = getServerSupabase(args);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.session) {
    console.log("Login error:", error);
    session.flash("error", error?.message || "Login failed");

    return redirect("/login", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  console.log("Login success:", data);

  session.set("userId", data.user.id);

  return redirect("/", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export default function Page({ loaderData }: Route.ComponentProps) {
  const { error } = loaderData;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        <LoginForm />
      </div>
    </div>
  );
}
