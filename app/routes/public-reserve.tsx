import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { getPublicReserveData } from "@/features/booking/queries";
import { createGuestBooking } from "@/services/reservation";
import { Form, Link, data, redirect } from "react-router";
import type { Route } from "./+types/public-reserve";

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatSlot(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    timeStyle: "short",
    hour12: true,
  });
}

function formatSlotLong(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "full",
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
        fields: {
          guestName,
          guestEmail,
          startAt: startAtIso,
        },
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
        fields: {
          guestName,
          guestEmail,
          startAt: startAtIso,
        },
      },
      { status: 400 },
    );
  }

  return redirect(`/p/${userId}/reserve/${result.bookingId}`);
}

export default function PublicReservePage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const currentData = actionData ?? loaderData;
  const providerInitial = currentData.provider.userId.slice(0, 1).toUpperCase();

  const fieldErrors =
    actionData && !actionData.ok && "fieldErrors" in actionData
      ? actionData.fieldErrors
      : undefined;
  const formError =
    actionData && !actionData.ok && "formError" in actionData
      ? actionData.formError
      : null;

  const selectedServiceId = currentData.selectedService?.id ?? "";
  const fields =
    actionData && "fields" in actionData
      ? actionData.fields
      : {
          guestName: "",
          guestEmail: "",
          startAt: "",
        };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-8">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage
                src={currentData.provider.imageUrl!}
                alt={currentData.provider.displayName}
              />
              <AvatarFallback>{providerInitial}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{currentData.provider.displayName}</CardTitle>
              <CardDescription>
                {/* @{currentData.provider.userId}
                {" · "} */}
                {currentData.provider.serviceCount} servicios{" · "}
                {currentData.provider.timezone}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {!currentData.selectedService ? (
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
                {currentData.services.map((service) => {
                  const isSelected = service.id === selectedServiceId;

                  return (
                    <Link
                      key={service.id}
                      to={`/p/${currentData.provider.userId}/reserve?sid=${service.id}&date=${currentData.date}`}
                      className={[
                        "rounded-2xl border p-4 transition-colors",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50",
                      ].join(" ")}
                    >
                      <p className="font-medium text-sm">{service.name}</p>
                      <p className="text-muted-foreground mt-1 text-xs line-clamp-2">
                        {service.description || "Sin descripción"}
                      </p>
                      <p className="text-muted-foreground mt-2 text-xs">
                        {service.durationMinutes} min
                      </p>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Elige fecha y hora</CardTitle>
              </CardHeader>
              <CardContent>
                <Form method="get" className="flex flex-col gap-4">
                  <div className="grid gap-2 sm:max-w-xs">
                    <FieldLabel htmlFor="date">Fecha</FieldLabel>
                    <Input
                      id="date"
                      type="date"
                      name="date"
                      defaultValue={currentData.date}
                    />
                  </div>
                  <div className="grid gap-2 sm:max-w-xs">
                    <FieldLabel htmlFor="sid-mobile">Servicio</FieldLabel>
                    <NativeSelect
                      id="sid-mobile"
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
                  <div>
                    <Button type="submit" variant="outline">
                      Buscar disponibilidad
                    </Button>
                  </div>
                </Form>

                <div className="mt-6">
                  <p className="text-sm font-medium">Horarios disponibles</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {currentData.slots.length === 0
                      ? "No hay slots para la fecha seleccionada."
                      : `${currentData.slots.length} slots disponibles.`}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Confirma tu cita</CardTitle>
                <CardDescription>
                  {currentData.selectedService.name} ·{" "}
                  {currentData.selectedService.durationMinutes} min
                </CardDescription>
              </CardHeader>
              <CardContent>
                {formError && (
                  <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
                    {formError}
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
                      <FieldLabel>Horario disponible</FieldLabel>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {currentData.slots.map((slot) => {
                          const inputId = `slot-${slot}`;

                          return (
                            <label
                              key={slot}
                              htmlFor={inputId}
                              className="border-input has-[:checked]:border-primary has-[:checked]:bg-primary/10 hover:bg-muted/50 flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2 text-sm"
                            >
                              <input
                                id={inputId}
                                type="radio"
                                name="startAt"
                                value={slot}
                                defaultChecked={fields.startAt === slot}
                                className="sr-only"
                              />
                              {formatSlot(slot)}
                            </label>
                          );
                        })}
                      </div>
                      <FieldDescription>
                        {fields.startAt
                          ? `Seleccionado: ${formatSlotLong(fields.startAt)}`
                          : "Selecciona un horario para continuar."}
                      </FieldDescription>
                      <FieldError
                        errors={
                          fieldErrors?.startAt
                            ? [{ message: fieldErrors.startAt }]
                            : undefined
                        }
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="guestName">
                        Nombre completo
                      </FieldLabel>
                      <Input
                        id="guestName"
                        name="guestName"
                        placeholder="Ej: María González"
                        defaultValue={fields.guestName}
                        required
                        aria-invalid={fieldErrors?.guestName ? true : undefined}
                      />
                      <FieldError
                        errors={
                          fieldErrors?.guestName
                            ? [{ message: fieldErrors.guestName }]
                            : undefined
                        }
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="guestEmail">Email</FieldLabel>
                      <Input
                        id="guestEmail"
                        type="email"
                        name="guestEmail"
                        placeholder="tu@email.com"
                        defaultValue={fields.guestEmail}
                        required
                        aria-invalid={
                          fieldErrors?.guestEmail ? true : undefined
                        }
                      />
                      <FieldError
                        errors={
                          fieldErrors?.guestEmail
                            ? [{ message: fieldErrors.guestEmail }]
                            : undefined
                        }
                      />
                    </Field>

                    <div>
                      <Button
                        type="submit"
                        disabled={currentData.slots.length === 0}
                      >
                        Confirmar reserva
                      </Button>
                    </div>
                  </FieldGroup>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
