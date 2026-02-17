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
  FieldContent,
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
import {
  parseSubmission,
  report,
  useForm,
  useFormData,
} from "@conform-to/react/future";
import { coerceFormValue, formatResult } from "@conform-to/zod/v4/future";
import { Form, Link, redirect } from "react-router";
import { z } from "zod/v4";
import type { Route } from "./+types/public-reserve";
import { useRef } from "react";

const bookingSchema = coerceFormValue(
  z.object({
    serviceId: z.string().min(1, "Selecciona un servicio."),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida."),
    startAt: z.string().min(1, "Selecciona un horario."),
    guestName: z.string().min(1, "Tu nombre es obligatorio."),
    guestEmail: z.email("Email inválido."),
  }),
);

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
    hour12: true,
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
  const submission = parseSubmission(formData);
  const result = bookingSchema.safeParse(submission.payload);

  if (!result.success) {
    return {
      result: report(submission, { error: formatResult(result) }),
    };
  }

  const values = result.data;

  const userId = params.userId;
  const serviceId = values.serviceId;
  const startAtIso = values.startAt;
  const guestName = values.guestName;
  const guestEmail = values.guestEmail;

  const bookingResult = await createGuestBooking({
    userId,
    serviceId,
    startAtIso,
    guestName,
    guestEmail,
  });

  if (!bookingResult.ok) {
    return {
      result: report(submission, {
        error: { formErrors: [bookingResult.message] },
      }),
    };
  }

  throw redirect(`/r/${bookingResult.bookingId}`);
}

export default function PublicReservePage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const providerInitial = loaderData.provider.userId.slice(0, 1).toUpperCase();

  const selectedServiceId = loaderData.selectedService?.id ?? "";

  const formRef = useRef<HTMLFormElement>(null);
  const { form, fields } = useForm(bookingSchema, {
    id: "public-reserve",
    lastResult: actionData?.result,
    defaultValue: {
      serviceId: selectedServiceId,
      date: loaderData.date,
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onInput",
  });
  const formError = form.errors?.[0];

  const startAtValue = useFormData(formRef, (payload) =>
    payload.get("startAt"),
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-8">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage
                src={loaderData.provider.imageUrl!}
                alt={loaderData.provider.displayName}
              />
              <AvatarFallback>{providerInitial}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{loaderData.provider.displayName}</CardTitle>
              <CardDescription>
                {/* @{currentData.provider.userId}
                {" · "} */}
                {loaderData.provider.serviceCount} servicios{" · "}
                {loaderData.provider.timezone}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {!loaderData.selectedService ? (
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
                {loaderData.services.map((service) => {
                  const isSelected = service.id === selectedServiceId;

                  return (
                    <Link
                      key={service.id}
                      to={`/p/${loaderData.provider.userId}/reserve?sid=${service.id}&date=${loaderData.date}`}
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
                  <FieldGroup className="flex-row">
                    <Field className="grid gap-2 sm:max-w-xs">
                      <FieldLabel htmlFor="date">Fecha</FieldLabel>
                      <FieldContent>
                        <Input
                          id="date"
                          type="date"
                          name="date"
                          defaultValue={loaderData.date}
                        />
                      </FieldContent>
                    </Field>
                    <Field className="grid gap-2 sm:max-w-xs">
                      <FieldLabel htmlFor="sid-mobile">Servicio</FieldLabel>
                      <NativeSelect
                        id="sid-mobile"
                        name="sid"
                        defaultValue={selectedServiceId}
                      >
                        {loaderData.services.map((service) => (
                          <NativeSelectOption
                            key={service.id}
                            value={service.id}
                          >
                            {service.name}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </Field>
                  </FieldGroup>
                  <div>
                    <Button type="submit" variant="outline">
                      Buscar disponibilidad
                    </Button>
                  </div>
                </Form>

                <div className="mt-6">
                  <p className="text-sm font-medium">Horarios disponibles</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {loaderData.slots.length === 0
                      ? "No hay slots para la fecha seleccionada."
                      : `${loaderData.slots.length} slots disponibles.`}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Confirma tu cita</CardTitle>
                <CardDescription>
                  {loaderData.selectedService.name} ·{" "}
                  {loaderData.selectedService.durationMinutes} min
                </CardDescription>
              </CardHeader>
              <CardContent>
                {formError && (
                  <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
                    {formError}
                  </div>
                )}
                <Form
                  {...form.props}
                  ref={formRef}
                  method="post"
                  className="flex flex-col gap-6"
                >
                  <input
                    type="hidden"
                    id={fields.serviceId.id}
                    name={fields.serviceId.name}
                    value={selectedServiceId}
                  />
                  <input
                    type="hidden"
                    id={fields.date.id}
                    name={fields.date.name}
                    value={loaderData.date}
                  />

                  <FieldGroup>
                    <Field>
                      <FieldLabel>Horario disponible</FieldLabel>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {loaderData.slots.map((value, index) => {
                          const id = `slot-${value}-${index}`;

                          return (
                            <label
                              key={id}
                              htmlFor={id}
                              className="border-input has-checked:border-primary has-checked:bg-primary/10 hover:bg-muted/50 flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2 text-sm"
                            >
                              <input
                                className="sr-only"
                                type="radio"
                                id={id}
                                name={fields.startAt.name}
                                value={value}
                                defaultChecked={
                                  fields.startAt.defaultValue === value
                                }
                              />
                              {formatSlot(value)}
                            </label>
                          );
                        })}
                      </div>
                      <FieldDescription>
                        {startAtValue
                          ? `Seleccionado: ${formatSlotLong(startAtValue)}`
                          : "Selecciona un horario para continuar."}
                      </FieldDescription>
                      <FieldError
                        errors={
                          fields.startAt.errors?.length
                            ? [{ message: fields.startAt.errors[0] }]
                            : undefined
                        }
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="guestName">
                        Nombre completo
                      </FieldLabel>
                      <Input
                        placeholder="Ej: María González"
                        required
                        aria-invalid={fields.guestName.ariaInvalid}
                        id={fields.guestName.id}
                        name={fields.guestName.name}
                        defaultValue={fields.guestName.defaultValue}
                      />
                      <FieldError
                        errors={
                          fields.guestName.errors?.length
                            ? [{ message: fields.guestName.errors[0] }]
                            : undefined
                        }
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="guestEmail">Email</FieldLabel>
                      <Input
                        placeholder="tu@email.com"
                        required
                        aria-invalid={!fields.guestEmail.valid}
                        id={fields.guestEmail.id}
                        name={fields.guestEmail.name}
                        defaultValue={fields.guestEmail.defaultValue}
                        type="email"
                      />
                      <FieldError
                        errors={
                          fields.guestEmail.errors?.length
                            ? [{ message: fields.guestEmail.errors[0] }]
                            : undefined
                        }
                      />
                    </Field>

                    <div>
                      <Button
                        type="submit"
                        disabled={loaderData.slots.length === 0}
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
