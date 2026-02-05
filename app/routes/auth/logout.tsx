import { SUPABASE } from "@/context";
import { destroySession, getSession } from "@/lib/server/session";
import { Form, redirect } from "react-router";

export async function action(args: { request: Request }) {
  const { request } = args;
  const session = await getSession(request.headers.get("Cookie"));
  const supabase = SUPABASE.get();
  await supabase.auth.signOut();

  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}

export default function LogoutPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <Form method="post">
        <button
          type="submit"
          className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-500"
        >
          Logout
        </button>
      </Form>
    </div>
  );
}
