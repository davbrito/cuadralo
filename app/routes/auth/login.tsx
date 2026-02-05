import { LoginForm } from "#components/login-form";
import { SUPABASE } from "@/context";
import { data, redirect } from "react-router";
import type { Route } from "./+types/login";
import { flashStorage } from "@/lib/server/session";

export async function loader() {
  console.log("login loader");
  const session = await SUPABASE.get().auth.getSession();
  if (session.data.session) {
    return redirect("/");
  }
}

export async function action(args: Route.ActionArgs) {
  const { request } = args;
  const session = await flashStorage.getSession(request.headers.get("Cookie"));

  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = SUPABASE.get();
  const response = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (response.error || !response.data.session) {
    session.flash("error", response.error?.message || "Login failed");

    return redirect("/login", {
      headers: {
        "Set-Cookie": await flashStorage.commitSession(session),
      },
    });
  }

  return data(
    {
      error: session.get("error"),
    },
    {
      headers: {
        "Set-Cookie": await flashStorage.commitSession(session),
      },
    },
  );
}

export default function Page({ actionData }: Route.ComponentProps) {
  const error = actionData?.error;

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
