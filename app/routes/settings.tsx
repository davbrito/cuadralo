import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  getProviderProfileSettings,
  type ProviderAvailability,
  updateProviderProfileSettings,
} from "@/services/profile";
import { parseSubmission, report, useForm } from "@conform-to/react/future";
import { coerceFormValue, formatResult } from "@conform-to/zod/v4/future";
import { set } from "lodash-es";
import { ResultAsync } from "neverthrow";
import { data, Form } from "react-router";
import { z } from "zod/v4";
import type { Route } from "./+types/settings";

const schema = coerceFormValue(
  z.object({
    timezone: z
      .string()
      .min(1, "La zona horaria es obligatoria.")
      .max(255, "La zona horaria no puede superar 255 caracteres.")
      .trim(),
    slotDurationMinutes: z
      .number()
      .int("La duración debe ser un número entero.")
      .min(5, "La duración debe estar entre 5 y 1440.")
      .max(1440, "La duración debe estar entre 5 y 1440."),
    availabilities: z.record(
      z.number(),
      z
        .object({
          enabled: z.boolean().default(false),
          startTime: z
            .string()
            .regex(
              /^([01]\d|2[0-3]):[0-5]\d$/,
              "El formato de hora no es válido.",
            ),
          endTime: z
            .string()
            .regex(
              /^([01]\d|2[0-3]):[0-5]\d$/,
              "El formato de hora no es válido.",
            ),
        })
        .refine((data) => {
          return !data.enabled
            ? true
            : toMinutes(data.startTime) < toMinutes(data.endTime);
        }, "La hora de inicio debe ser menor que la hora de fin."),
    ),
  }),
);

const WEEK_DAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
] as const;

function normalizeTimeForInput(value: string): string {
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
    return value.slice(0, 5);
  }

  if (/^\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  return "";
}

function buildAvailabilityFields(rows: ProviderAvailability[]) {
  const map = WEEK_DAYS.map((day) => {
    const availabilityForDay = rows.find((row) => row.weekDay === day.value);
    let data;

    if (availabilityForDay) {
      data = {
        enabled: true,
        startTime: normalizeTimeForInput(availabilityForDay.startTime),
        endTime: normalizeTimeForInput(availabilityForDay.endTime),
      };
    } else {
      data = {
        enabled: false,
        startTime: "09:00",
        endTime: "17:00",
      };
    }

    return [day.value, data] as const;
  });

  return Object.fromEntries(map);
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export async function loader() {
  const profile = await getProviderProfileSettings();
  return { profile };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const submission = parseSubmission(formData);

  for (const [key, value] of formData.entries()) {
    if (key.startsWith("availabilities")) {
      set(submission.payload, key, value === "on" ? true : value);
    }
  }

  const validationResult = schema.safeParse(submission.payload);

  if (!validationResult.success) {
    return {
      result: report(submission, { error: formatResult(validationResult) }),
    };
  }

  const formValues = validationResult.data;

  const timezone = formValues.timezone;
  const slotDurationMinutes = formValues.slotDurationMinutes;

  const availabilitiesToSave: ProviderAvailability[] = WEEK_DAYS.map((day) => {
    const field = formValues.availabilities[day.value];
    if (!field.enabled) return null;

    return {
      weekDay: day.value,
      startTime: field.startTime,
      endTime: field.endTime,
    };
  }).filter((item) => item !== null);

  const updateResult = await ResultAsync.fromPromise(
    updateProviderProfileSettings({
      timezone,
      slotDurationMinutes,
      availabilities: availabilitiesToSave,
    }),
    (error) => error,
  );

  if (updateResult.isErr()) {
    return data(
      {
        result: report(submission, {
          error: {
            formErrors: ["No se pudo actualizar el perfil. Intenta de nuevo."],
          },
        }),
      },
      { status: 500 },
    );
  }

  return { success: "Configuración actualizada." };
}

export default function SettingsPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const defaultAvailabilities = buildAvailabilityFields(
    loaderData.profile.availabilities,
  );

  const { form, fields } = useForm(schema, {
    lastResult: actionData?.result,
    defaultValue: {
      timezone: loaderData.profile.timezone,
      slotDurationMinutes: String(loaderData.profile.slotDurationMinutes),
      availabilities: defaultAvailabilities,
    },
  });

  const fieldErrors = form.fieldErrors;
  const formError = form.errors?.[0];
  const success =
    actionData && "success" in actionData ? actionData.success : null;

  const fieldset = fields.availabilities.getFieldset();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 md:p-10">
      <Card>
        <CardHeader>
          <CardTitle>Ajustes del provider</CardTitle>
          <CardDescription>
            Configura tu zona horaria, duración base y disponibilidad semanal.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={fields.timezone.id}>Timezone</FieldLabel>
                <Input
                  id={fields.timezone.id}
                  name={fields.timezone.name}
                  defaultValue={fields.timezone.defaultValue}
                  placeholder="Ej: America/Caracas"
                  required
                  aria-invalid={fields.timezone.ariaInvalid}
                />
                <FieldError
                  errors={
                    fields.timezone.ariaInvalid
                      ? [{ message: fields.timezone.errors?.join(", ") }]
                      : undefined
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor={fields.slotDurationMinutes.id}>
                  Slot duration (minutos)
                </FieldLabel>
                <Input
                  id={fields.slotDurationMinutes.id}
                  name={fields.slotDurationMinutes.name}
                  type="number"
                  min={5}
                  max={1440}
                  step={1}
                  defaultValue={fields.slotDurationMinutes.defaultValue}
                  required
                  aria-invalid={fields.slotDurationMinutes.ariaInvalid}
                />
                <FieldError
                  errors={
                    fields.slotDurationMinutes.ariaInvalid
                      ? [
                          {
                            message:
                              fields.slotDurationMinutes.errors?.join(", "),
                          },
                        ]
                      : undefined
                  }
                />
              </Field>

              <Field>
                <FieldLabel>Disponibilidad semanal</FieldLabel>
                <div className="grid gap-3">
                  {WEEK_DAYS.map((day) => {
                    const field = form.getFieldset(fieldset[day.value].name);

                    return (
                      <div
                        key={day.value}
                        className="rounded-2xl border bg-card p-4"
                      >
                        <div className="grid gap-3 sm:grid-cols-[160px_1fr_1fr] sm:items-end">
                          <label className="flex h-9 items-center gap-2 text-sm font-medium">
                            <Checkbox
                              name={field.enabled.name}
                              defaultChecked={field.enabled.defaultChecked}
                              className="h-4 w-4"
                            />
                            {day.label}
                          </label>

                          <div className="grid gap-2">
                            <FieldLabel
                              htmlFor={`availability-${day.value}-start`}
                            >
                              Desde
                            </FieldLabel>
                            <Input
                              id={field.startTime.id}
                              type="time"
                              name={field.startTime.name}
                              defaultValue={field.startTime.defaultValue}
                              aria-invalid={field.startTime.ariaInvalid}
                            />
                          </div>

                          <div className="grid gap-2">
                            <FieldLabel
                              htmlFor={`availability-${day.value}-end`}
                            >
                              Hasta
                            </FieldLabel>
                            <Input
                              id={field.endTime.id}
                              type="time"
                              name={field.endTime.name}
                              defaultValue={field.endTime.defaultValue}
                              aria-invalid={field.endTime.ariaInvalid}
                            />
                          </div>
                        </div>
                        <FieldError
                          className="mt-2"
                          errors={
                            field.endTime.ariaInvalid
                              ? [{ message: field.endTime.errors?.join(", ") }]
                              : undefined
                          }
                        />
                      </div>
                    );
                  })}
                </div>
                <FieldError
                  errors={
                    fieldErrors?.availabilities
                      ? fieldErrors.availabilities.map((error) => ({
                          message: error,
                        }))
                      : undefined
                  }
                />
              </Field>

              <div>
                <Button type="submit">Guardar ajustes</Button>
              </div>
            </FieldGroup>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
