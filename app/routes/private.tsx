import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { CLOUDFLARE } from "@/context";
import { setupSupabaseClient } from "@/lib/client/supabase.client";
import { getSupabaseClientConfig } from "@/lib/server/supabase.server";
import { privateMiddleware } from "@/middleware/auth";
import {
  Calendar01Icon,
  Settings01Icon,
  Table01Icon,
  User03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Form, Link, Outlet } from "react-router";
import type { Route } from "./+types/private";

export const middleware: Route.MiddlewareFunction[] = [privateMiddleware];

export default function PrivateLayout() {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Cuádralo</span>
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
              Dashboard
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Panel</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive render={<Link to="/" />}>
                    <HugeiconsIcon
                      icon={Table01Icon}
                      strokeWidth={2}
                      className="size-4"
                      aria-hidden
                    />
                    <span>Servicios</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <HugeiconsIcon
                      icon={User03Icon}
                      strokeWidth={2}
                      className="size-4"
                      aria-hidden
                    />
                    <span>Clientes</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <HugeiconsIcon
                      icon={Calendar01Icon}
                      strokeWidth={2}
                      className="size-4"
                      aria-hidden
                    />
                    <span>Agenda</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <HugeiconsIcon
                      icon={Settings01Icon}
                      strokeWidth={2}
                      className="size-4"
                      aria-hidden
                    />
                    <span>Ajustes</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <Form method="post" action="/logout">
            <Button type="submit" variant="outline" className="w-full">
              Cerrar sesión
            </Button>
          </Form>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="bg-muted/40">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Panel principal
                </p>
                <h1 className="text-lg font-semibold text-foreground">
                  Gestiona tus servicios
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Card className="hidden px-3 py-2 text-xs text-muted-foreground md:block">
                Actualizado hoy
              </Card>
              <Form method="post" action="/logout" className="lg:hidden">
                <Button type="submit" variant="outline">
                  Salir
                </Button>
              </Form>
            </div>
          </div>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function loader() {
  return {
    supabase: getSupabaseClientConfig(CLOUDFLARE.get().env),
  };
}

export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  const { supabase } = await serverLoader();
  setupSupabaseClient(supabase);
}
