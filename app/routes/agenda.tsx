import AgendaCalendar from "@/components/agenda-calendar";
import AgendaList from "@/components/agenda-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AUTH } from "@/core/context.server";
import { listActiveBookings } from "@/features/booking/reservation";
import type { Route } from "./+types/agenda";

export async function loader() {
  const { userId } = AUTH.get();
  const bookings = await listActiveBookings(userId);

  return { bookings };
}

export default function Agenda({ loaderData }: Route.ComponentProps) {
  const { bookings } = loaderData;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6 md:p-10">
      <Card>
        <CardHeader>
          <CardTitle>Agenda</CardTitle>
          <CardDescription>
            Lista de reservas activas y vista de calendario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" orientation="vertical" className="flex-col">
            <TabsList>
              <TabsTrigger value="list">Lista</TabsTrigger>
              <TabsTrigger value="calendar">Calendario</TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <AgendaList bookings={bookings} />
            </TabsContent>

            <TabsContent value="calendar">
              <AgendaCalendar bookings={bookings} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
