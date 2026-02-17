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
import { Form, data } from "react-router";
import type { Route } from "./+types/settings";

const WEEK_DAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
] as const;

type AvailabilityField = {
  enabled: boolean;
  startTime: string;
  endTime: string;
};

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
  const map: Record<number, AvailabilityField> = Object.fromEntries(
    WEEK_DAYS.map((day) => [
      day.value,
      {
        enabled: false,
        startTime: "09:00",
        endTime: "17:00",
      } satisfies AvailabilityField,
    ]),
  );

  for (const row of rows) {
    if (map[row.weekDay]?.enabled) {
      continue;
    }

    map[row.weekDay] = {
      enabled: true,
      startTime: normalizeTimeForInput(row.startTime),
      endTime: normalizeTimeForInput(row.endTime),
    };
  }

  return map;
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

  const timezone = String(formData.get("timezone") ?? "").trim();
  const slotDurationMinutesRaw = String(
    formData.get("slotDurationMinutes") ?? "",
  ).trim();
  const slotDurationMinutes = Number(slotDurationMinutesRaw);

  const availabilityFields = Object.fromEntries(
    WEEK_DAYS.map((day) => {
      const enabled =
        formData.get(`availability-${day.value}-enabled`) === "on";
      const startTime = String(
        formData.get(`availability-${day.value}-start`) ?? "",
      ).trim();
      const endTime = String(
        formData.get(`availability-${day.value}-end`) ?? "",
      ).trim();

      return [
        day.value,
        {
          enabled,
          startTime,
          endTime,
        } satisfies AvailabilityField,
      ];
    }),
  ) as Record<number, AvailabilityField>;

  const fieldErrors: Record<string, string> = {};

  if (!timezone) {
    fieldErrors.timezone = "La zona horaria es obligatoria.";
  } else if (timezone.length > 255) {
    fieldErrors.timezone = "La zona horaria no puede superar 255 caracteres.";
  }

  if (!Number.isInteger(slotDurationMinutes)) {
    fieldErrors.slotDurationMinutes = "La duración debe ser un número entero.";
  } else if (slotDurationMinutes < 5 || slotDurationMinutes > 1440) {
    fieldErrors.slotDurationMinutes = "La duración debe estar entre 5 y 1440.";
  }

  const availabilitiesToSave: ProviderAvailability[] = [];

  for (const day of WEEK_DAYS) {
    const availability = availabilityFields[day.value];

    if (!availability.enabled) {
      continue;
    }

    const errorKey = `availability-${day.value}`;

    if (!availability.startTime || !availability.endTime) {
      fieldErrors[errorKey] =
        "Debes indicar hora de inicio y fin para este día.";
      continue;
    }

    const isStartTimeValid = /^([01]\d|2[0-3]):[0-5]\d$/.test(
      availability.startTime,
    );
    const isEndTimeValid = /^([01]\d|2[0-3]):[0-5]\d$/.test(
      availability.endTime,
    );

    if (!isStartTimeValid || !isEndTimeValid) {
      fieldErrors[errorKey] = "El formato de hora no es válido.";
      continue;
    }

    if (toMinutes(availability.startTime) >= toMinutes(availability.endTime)) {
      fieldErrors[errorKey] =
        "La hora de inicio debe ser menor que la hora de fin.";
      continue;
    }

    availabilitiesToSave.push({
      weekDay: day.value,
      startTime: availability.startTime,
      endTime: availability.endTime,
    });
  }

  if (availabilitiesToSave.length === 0) {
    fieldErrors.availabilities = "Configura al menos un día disponible.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return data(
      {
        ok: false,
        fieldErrors,
        fields: {
          timezone,
          slotDurationMinutes: slotDurationMinutesRaw,
          availabilities: availabilityFields,
        },
      },
      { status: 400 },
    );
  }

  const [error] = await updateProviderProfileSettings({
    timezone,
    slotDurationMinutes,
    availabilities: availabilitiesToSave,
  }).then(
    () => [null] as const,
    (updateError) => [updateError] as const,
  );

  if (error) {
    return data(
      {
        ok: false,
        formError: "No se pudo actualizar el perfil. Intenta de nuevo.",
        fields: {
          timezone,
          slotDurationMinutes: slotDurationMinutesRaw,
          availabilities: availabilityFields,
        },
      },
      { status: 500 },
    );
  }

  return data({ ok: true, success: "Configuración actualizada." });
}

export default function SettingsPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const action = actionData ?? undefined;

  const fields =
    action && "fields" in action
      ? action.fields
      : {
          timezone: loaderData.profile.timezone,
          slotDurationMinutes: String(loaderData.profile.slotDurationMinutes),
          availabilities: buildAvailabilityFields(
            loaderData.profile.availabilities,
          ),
        };

  const fieldErrors =
    action && "fieldErrors" in action ? action.fieldErrors : undefined;
  const formError = action && "formError" in action ? action.formError : null;
  const success = action && "success" in action ? action.success : null;

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
                <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
                <Input
                  id="timezone"
                  name="timezone"
                  placeholder="Ej: America/Caracas"
                  defaultValue={fields.timezone}
                  required
                  aria-invalid={fieldErrors?.timezone ? true : undefined}
                />
                <FieldError
                  errors={
                    fieldErrors?.timezone
                      ? [{ message: fieldErrors.timezone }]
                      : undefined
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="slotDurationMinutes">
                  Slot duration (minutos)
                </FieldLabel>
                <Input
                  id="slotDurationMinutes"
                  name="slotDurationMinutes"
                  type="number"
                  min={5}
                  max={1440}
                  step={1}
                  defaultValue={fields.slotDurationMinutes}
                  required
                  aria-invalid={
                    fieldErrors?.slotDurationMinutes ? true : undefined
                  }
                />
                <FieldError
                  errors={
                    fieldErrors?.slotDurationMinutes
                      ? [{ message: fieldErrors.slotDurationMinutes }]
                      : undefined
                  }
                />
              </Field>

              <Field>
                <FieldLabel>Disponibilidad semanal</FieldLabel>
                <div className="grid gap-3">
                  {WEEK_DAYS.map((day) => {
                    const dayField = fields.availabilities[day.value];
                    const dayError = fieldErrors?.[`availability-${day.value}`];

                    return (
                      <div
                        key={day.value}
                        className="rounded-2xl border bg-card p-4"
                      >
                        <div className="grid gap-3 sm:grid-cols-[160px_1fr_1fr] sm:items-end">
                          <label className="flex h-9 items-center gap-2 text-sm font-medium">
                            <input
                              type="checkbox"
                              name={`availability-${day.value}-enabled`}
                              defaultChecked={dayField.enabled}
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
                              id={`availability-${day.value}-start`}
                              type="time"
                              name={`availability-${day.value}-start`}
                              defaultValue={dayField.startTime}
                              aria-invalid={dayError ? true : undefined}
                            />
                          </div>

                          <div className="grid gap-2">
                            <FieldLabel
                              htmlFor={`availability-${day.value}-end`}
                            >
                              Hasta
                            </FieldLabel>
                            <Input
                              id={`availability-${day.value}-end`}
                              type="time"
                              name={`availability-${day.value}-end`}
                              defaultValue={dayField.endTime}
                              aria-invalid={dayError ? true : undefined}
                            />
                          </div>
                        </div>
                        <FieldError
                          className="mt-2"
                          errors={
                            dayError ? [{ message: dayError }] : undefined
                          }
                        />
                      </div>
                    );
                  })}
                </div>
                <FieldError
                  errors={
                    fieldErrors?.availabilities
                      ? [{ message: fieldErrors.availabilities }]
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
