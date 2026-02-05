import { authMiddleware } from "@/middleware/auth";
import { Welcome } from "../welcome/welcome";
import type { Route } from "./+types/home";

export const middleware: Route.MiddlewareFunction[] = [authMiddleware];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Cuádralo" },
    {
      name: "description",
      content:
        "Cuádralo - Una plataforma para gestionar tus citas con clientes de manera eficiente y sencilla.",
    },
  ];
}

export async function loader(args: Route.LoaderArgs) {
  const message = "Hello World";
  return { message };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <Welcome message={loaderData.message} />;
}
