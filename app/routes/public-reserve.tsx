import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getPublicReserveData } from "@/features/booking/queries";
import { createGuestBooking } from "@/services/reservation";
import { Form, data } from "react-router";
import type { Route } from "./+types/public-reserve";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatSlot(iso: string) {
  return new Intl.DateTimeFormat("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const userId = params.userId;
  const url = new URL(request.url);

  const serviceId = url.searchParams.get("sid");
  const dateParam = url.searchParams.get("date");
  const date =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? dateParam
      : todayDateString();

  const reserveData = await getPublicReserveData({
    userId,
    serviceId,
    date,
  });

  return {
    userId,
    date,
    ...reserveData,
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();

  const userId = params.userId;
  const serviceId = String(formData.get("serviceId") ?? "");
  const date = String(formData.get("date") ?? "");
  const startAtIso = String(formData.get("startAt") ?? "");
  const guestName = String(formData.get("guestName") ?? "").trim();
  const guestEmail = String(formData.get("guestEmail") ?? "").trim();

  const fieldErrors: {
    serviceId?: string;
    startAt?: string;
    guestName?: string;
    guestEmail?: string;
  } = {};

  if (!serviceId) {
    fieldErrors.serviceId = "Selecciona un servicio.";
  }

  if (!startAtIso) {
    fieldErrors.startAt = "Selecciona un horario.";
  }

  if (!guestName) {
    fieldErrors.guestName = "Tu nombre es obligatorio.";
  }

  if (!guestEmail) {
    fieldErrors.guestEmail = "Tu email es obligatorio.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    const reserveData = await getPublicReserveData({
      userId,
      serviceId,
      date,
    });

    return data(
      {
        ok: false,
        date,
        ...reserveData,
        fieldErrors,
      },
      { status: 400 },
    );
  }

  const result = await createGuestBooking({
    userId,
    serviceId,
    startAtIso,
    guestName,
    guestEmail,
  });

  if (!result.ok) {
    const reserveData = await getPublicReserveData({
      userId,
      serviceId,
      date,
    });

    return data(
      {
        ok: false,
        date,
        ...reserveData,
        formError: result.message,
      },
      { status: 400 },
    );
  }

  const reserveData = await getPublicReserveData({
    userId,
    serviceId,
    date,
  });

  return data({
    ok: true,
    success: "Reserva creada correctamente.",
    date,
    ...reserveData,
  });
}

export default function PublicReservePage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const currentData = actionData ?? loaderData;

  const fieldErrors =
    actionData && !actionData.ok && "fieldErrors" in actionData
      ? actionData.fieldErrors
      : undefined;
  const formError =
    actionData && !actionData.ok && "formError" in actionData
      ? actionData.formError
      : null;
  const success =
    actionData && actionData.ok && "success" in actionData
      ? actionData.success
      : null;

  const selectedServiceId = currentData.selectedService?.id ?? "";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 md:p-10">
      <Card>
        <CardHeader>
          <CardTitle>Reserva tu cita</CardTitle>
          <CardDescription>
            Selecciona el servicio, elige un horario disponible y completa tu
            reserva.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form
            method="get"
            className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end"
          >
            <div className="grid gap-2">
              <FieldLabel htmlFor="sid">Servicio</FieldLabel>
              <NativeSelect
                id="sid"
                name="sid"
                defaultValue={selectedServiceId}
              >
                {currentData.services.map((service) => (
                  <NativeSelectOption key={service.id} value={service.id}>
                    {service.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-2">
              <FieldLabel htmlFor="date">Fecha</FieldLabel>
              <Input
                id="date"
                type="date"
                name="date"
                defaultValue={currentData.date}
              />
            </div>
            <Button type="submit" variant="outline">
              Buscar Disponibilidad
            </Button>
          </Form>

          {currentData.selectedService ? (
            <>
              <div className="mb-4 rounded-md border p-4">
                <p className="text-sm font-semibold">
                  {currentData.selectedService.name}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {currentData.selectedService.description || "Sin descripción"}
                </p>
              </div>

              {formError && (
                <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
                  {formError}
                </div>
              )}
              {success && (
                <div className="mb-4 rounded-md bg-emerald-50 p-4 text-sm text-emerald-700">
                  {success}
                </div>
              )}

              <Form method="post" className="flex flex-col gap-6">
                <input
                  type="hidden"
                  name="serviceId"
                  value={selectedServiceId}
                />
                <input type="hidden" name="date" value={currentData.date} />

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="startAt">
                      Horario disponible
                    </FieldLabel>
                    <select
                      id="startAt"
                      name="startAt"
                      defaultValue=""
                      className="border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 min-h-9 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
                      aria-invalid={fieldErrors?.startAt ? true : undefined}
                      required
                    >
                      <option value="" disabled>
                        Selecciona un horario
                      </option>
                      {currentData.slots.map((slot) => (
                        <option key={slot} value={slot}>
                          {formatSlot(slot)}
                        </option>
                      ))}
                    </select>
                    <FieldDescription>
                      {currentData.slots.length === 0
                        ? "No hay slots disponibles para esta fecha."
                        : `${currentData.slots.length} slots disponibles.`}
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="guestName">Nombre</FieldLabel>
                    <Input
                      id="guestName"
                      name="guestName"
                      placeholder="Tu nombre"
                      required
                      aria-invalid={fieldErrors?.guestName ? true : undefined}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="guestEmail">Email</FieldLabel>
                    <Input
                      id="guestEmail"
                      type="email"
                      name="guestEmail"
                      placeholder="tu@email.com"
                      required
                      aria-invalid={fieldErrors?.guestEmail ? true : undefined}
                    />
                  </Field>

                  <div>
                    <Button
                      type="submit"
                      disabled={currentData.slots.length === 0}
                    >
                      Reservar
                    </Button>
                  </div>
                </FieldGroup>
              </Form>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              Este perfil aún no tiene servicios disponibles para reservar.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
