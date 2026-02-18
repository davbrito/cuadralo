import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUserById } from "@/features/auth/queries";
import { getUserServices } from "@/features/provider/queries";
import { cn } from "@/lib/utils";
import { NavLink, Outlet } from "react-router";
import type { Route } from "./+types/create";

export async function loader({ params }: Route.LoaderArgs) {
  const userId = params.userId;

  const services = await getUserServices(userId);
  const provider = await getUserById(userId);

  return {
    services,
    provider,
  };
}

export default function PublicReservePage({
  loaderData,
  params: { serviceId },
}: Route.ComponentProps) {
  const { provider, services } = loaderData;
  const providerInitial = provider.userId.slice(0, 1).toUpperCase();

  const selectedService =
    services.find((service) => service.id === serviceId) ?? services.at(0);
  const providerServiceCount = services.length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-8">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage
                src={provider.imageUrl!}
                alt={provider.displayName}
              />
              <AvatarFallback>{providerInitial}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{provider.displayName}</CardTitle>
              <CardDescription>
                {/* @{currentData.provider.userId}
                {" · "} */}
                {providerServiceCount} servicios{" · "}
                {provider.profile.timezone}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {!selectedService ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">
              Este perfil aún no tiene servicios disponibles para reservar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Selecciona un servicio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {services.map((service) => {
                  return (
                    <NavLink
                      key={service.id}
                      to={{
                        pathname: `/p/${provider.userId}/reserve/${service.id}`,
                      }}
                      className={cn(
                        "rounded-2xl border p-4 transition-colors",
                        "aria-[current=page]:border-primary aria-[current=page]:bg-primary/5",
                        "hover:bg-muted/50",
                      )}
                    >
                      <p className="text-sm font-medium">{service.name}</p>
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                        {service.description || "Sin descripción"}
                      </p>
                      <p className="text-muted-foreground mt-2 text-xs">
                        {service.durationMinutes} min
                      </p>
                    </NavLink>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          <Outlet context={{ selectedService }} />
        </div>
      )}
    </div>
  );
}
