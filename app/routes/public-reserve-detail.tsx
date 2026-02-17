import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPublicBookingDetail } from "@/features/booking/queries";
import { cn } from "@/lib/utils";
import { Link, data } from "react-router";
import type { Route } from "./+types/public-reserve-detail";

function formatDateTime(date: Date, timezone: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: timezone,
  }).format(date);
}

export async function loader({ params }: Route.LoaderArgs) {
  const reserveId = params.reserveId;
  if (!reserveId) {
    throw data("Reserva no encontrada", { status: 404 });
  }

  const detail = await getPublicBookingDetail(reserveId);

  if (!detail) {
    throw data("Reserva no encontrada", { status: 404 });
  }

  return detail;
}

export default function PublicReserveDetailPage({
  loaderData,
}: Route.ComponentProps) {
  const { provider, booking } = loaderData;
  const providerInitial = provider.userId.slice(0, 1).toUpperCase();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-8">
      <Card>
        <CardHeader className="flex-row items-center gap-4">
          <Avatar>
            <AvatarImage
              src={provider.imageUrl ?? undefined}
              alt={provider.displayName}
            />
            <AvatarFallback>{providerInitial}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{provider.displayName}</CardTitle>
            <CardDescription>{provider.timezone}</CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reserva confirmada</CardTitle>
          <CardDescription>ID de reserva: {booking.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="font-medium">Servicio:</span>{" "}
            {booking.service.name}
          </p>
          <p>
            <span className="font-medium">Duración:</span>{" "}
            {booking.service.durationMinutes} min
          </p>
          <p>
            <span className="font-medium">Horario:</span>{" "}
            {formatDateTime(booking.startTime, provider.timezone)}
          </p>
          <p>
            <span className="font-medium">Nombre:</span>{" "}
            {booking.guestName ?? "-"}
          </p>
          <p>
            <span className="font-medium">Email:</span>{" "}
            {booking.guestEmail ?? "-"}
          </p>

          <div className="pt-2">
            <Link
              to={`/p/${provider.userId}/reserve?sid=${booking.service.id}`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Crear otra reserva
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
