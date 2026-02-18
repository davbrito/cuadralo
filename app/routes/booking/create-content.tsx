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
  getPublicReserveData,
  type PublicService,
} from "@/features/booking/queries";
import { createGuestBooking } from "@/features/booking/reservation";
import {
  parseSubmission,
  report,
  useForm,
  useFormData,
} from "@conform-to/react/future";
import { coerceFormValue, formatResult } from "@conform-to/zod/v4/future";
import { DateTime } from "luxon";
import { useRef } from "react";
import { Form, redirect, useOutletContext } from "react-router";
import { z } from "zod/v4";
import type { Route } from "./+types/create-content";

const bookingSchema = coerceFormValue(
  z.object({
    serviceId: z.string().min(1, "Selecciona un servicio."),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida."),
    startAt: z.string().min(1, "Selecciona un horario."),
    guestName: z.string().min(1, "Tu nombre es obligatorio."),
    guestEmail: z.email("Email inválido."),
  }),
);

export async function loader({ request, params }: Route.LoaderArgs) {
  const { userId, serviceId } = params;
  const url = new URL(request.url);

  const dateParam = url.searchParams.get("date");
  const date =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? dateParam
      : DateTime.now().toISODate();
  const reserveData = await getPublicReserveData({
    userId,
    serviceId,
    date,
  });

  return { reserveData, date };
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

export default function CreateBookingContent(props: Route.ComponentProps) {
  const { loaderData, actionData } = props;

  const reserveData = loaderData.reserveData;
  const { slots } = reserveData;

  const { selectedService } = useOutletContext<{
    selectedService: PublicService | null;
  }>();
  const selectedServiceId = selectedService?.id ?? "";

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

  const startAtValue = useFormData(formRef, (payload) =>
    payload.get("startAt"),
  );
  const formError = form.errors?.[0];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Elige fecha y hora</CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="get" className="flex gap-4 sm:flex-row">
            <FieldGroup className="flex-row">
              <Field className="grid gap-2 sm:max-w-xs">
                <FieldLabel htmlFor="date">Fecha</FieldLabel>
                <FieldContent>
                  <Input
                    id="date"
                    type="date"
                    name="date"
                    defaultValue={loaderData.date}
                    onChange={(e) => {
                      e.target.form?.requestSubmit();
                    }}
                    min={DateTime.now().toISODate()}
                  />
                </FieldContent>
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
              {slots.length === 0
                ? "No hay slots para la fecha seleccionada."
                : `${slots.length} slots disponibles.`}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Confirma tu cita</CardTitle>
          <CardDescription>
            {selectedService?.name} · {selectedService?.durationMinutes} min
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
                  {slots.map((value, index) => {
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
                          defaultChecked={fields.startAt.defaultValue === value}
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
                <FieldLabel htmlFor="guestName">Nombre completo</FieldLabel>
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
                <Button type="submit" disabled={slots.length === 0}>
                  Confirmar reserva
                </Button>
              </div>
            </FieldGroup>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
