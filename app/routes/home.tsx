import { authMiddleware } from "@/middleware/auth";
import { Welcome } from "../welcome/welcome";
import type { Route } from "./+types/home";

export const middleware: Route.MiddlewareFunction[] = [authMiddleware];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader(args: Route.LoaderArgs) {
  const message = "Hello World";
  return { message };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <Welcome message={loaderData.message} />;
}
