"use client";

import { AppUserButton } from "@/components/app-user-button";
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
import { AUTH } from "@/core/context.server";
import { ensureProfile } from "@/features/auth/mutations";
import { privateMiddleware } from "@/middleware/auth";
import { SignedIn } from "@clerk/react-router";
import {
  Calendar01Icon,
  Settings01Icon,
  Table01Icon,
  User03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link, Outlet } from "react-router";
import type { Route } from "./+types/private";

export const middleware: Route.MiddlewareFunction[] = [privateMiddleware];

export async function loader() {
  const userId = AUTH.get().userId;

  await ensureProfile(userId);

  return { userId };
}

export default function PrivateLayout() {
  return (
    <SignedIn>
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
          <SidebarFooter></SidebarFooter>
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
              <AppUserButton />
            </div>
          </header>
          <main className="flex-1">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </SignedIn>
  );
}
