import { Welcome } from "../welcome/welcome";
import type { Route } from "./+types/home";

export function meta() {
  return [
    { title: "Cuádralo" },
    {
      name: "description",
      content:
        "Cuádralo - Una plataforma para gestionar tus citas con clientes de manera eficiente y sencilla.",
    },
  ];
}

export async function loader() {
  const message = "Hello World";
  return { message };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <Welcome message={loaderData.message} />;
}
