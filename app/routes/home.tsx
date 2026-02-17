import { Button, buttonVariants } from "@/components/ui/button";
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
import { AUTH } from "@/core/context.server";
import { cn } from "@/lib/utils";
import {
  createService,
  listServices,
  updateServiceDuration,
} from "@/services/service";
import { Form, Link, data } from "react-router";
import type { Route } from "./+types/home";

export async function loader() {
  const { userId } = AUTH.get();
  const [error, services] = await listServices(userId).then(
    (services) => [null, services] as const,
    (error) => [error, null] as const,
  );

  return {
    userId,
    services,
    loadError: error?.message,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "create");

  if (intent === "updateDuration") {
    const serviceId = String(formData.get("serviceId") ?? "").trim();
    const durationMinutesRaw = String(
      formData.get("durationMinutes") ?? "",
    ).trim();
    const durationMinutes = Number(durationMinutesRaw);

    if (!serviceId) {
      return data(
        {
          ok: false,
          intent,
          formError: "No se encontró el servicio a actualizar.",
        },
        { status: 400 },
      );
    }

    if (
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 1 ||
      durationMinutes > 1440
    ) {
      return data(
        {
          ok: false,
          intent,
          formError: "La duración debe estar entre 1 y 1440 minutos.",
        },
        { status: 400 },
      );
    }

    const [error, updated] = await updateServiceDuration({
      serviceId,
      durationMinutes,
    }).then(
      (rows) => [null, rows] as const,
      (updateError) => [updateError, null] as const,
    );

    if (error || !updated || updated.length === 0) {
      return data(
        {
          ok: false,
          intent,
          formError: "No se pudo actualizar la duración del servicio.",
        },
        { status: 500 },
      );
    }

    return data({ ok: true, intent, success: "Duración actualizada." });
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const durationMinutesRaw = String(
    formData.get("durationMinutes") ?? "",
  ).trim();
  const durationMinutes = Number(durationMinutesRaw);

  const fieldErrors: {
    name?: string;
    description?: string;
    durationMinutes?: string;
  } = {};

  if (!name) {
    fieldErrors.name = "El nombre es obligatorio.";
  } else if (name.length > 255) {
    fieldErrors.name = "El nombre no puede superar 255 caracteres.";
  }

  if (description.length > 5000) {
    fieldErrors.description =
      "La descripción no puede superar 5000 caracteres.";
  }

  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 1 ||
    durationMinutes > 1440
  ) {
    fieldErrors.durationMinutes =
      "La duración debe estar entre 1 y 1440 minutos.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return data(
      {
        ok: false,
        intent,
        fieldErrors,
        fields: { name, description, durationMinutes: durationMinutesRaw },
      },
      { status: 400 },
    );
  }

  const [error] = await createService({
    name,
    description,
    durationMinutes,
  }).then(
    () => [null] as const,
    (error) => [error] as const,
  );

  if (error) {
    return data(
      {
        ok: false,
        intent,
        formError: "No se pudo crear el servicio. Intenta de nuevo.",
        fields: { name, description, durationMinutes: durationMinutesRaw },
      },
      { status: 500 },
    );
  }

  return data({ ok: true, intent, success: "Servicio creado correctamente." });
}

export default function Home({ loaderData, actionData }: Route.ComponentProps) {
  const { services, loadError, userId } = loaderData;
  const action = actionData ?? undefined;
  const fields =
    action && "fields" in action && action.intent === "create"
      ? action.fields
      : { name: "", description: "", durationMinutes: "30" };
  const fieldErrors =
    action && "fieldErrors" in action && action.intent === "create"
      ? action.fieldErrors
      : undefined;
  const formError = action && "formError" in action ? action.formError : null;
  const success = action && "success" in action ? action.success : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 md:p-10">
      <Card>
        <CardHeader>
          <CardTitle>Crear servicio</CardTitle>
          <CardDescription>
            Agrega un servicio para ofrecer a tus clientes.
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
                <FieldLabel htmlFor="name">Nombre</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  placeholder="Ej: Corte de cabello"
                  defaultValue={fields.name}
                  required
                  aria-invalid={fieldErrors?.name ? true : undefined}
                />
                <FieldError
                  errors={
                    fieldErrors?.name
                      ? [{ message: fieldErrors.name }]
                      : undefined
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="description">Descripción</FieldLabel>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Describe el servicio"
                  defaultValue={fields.description}
                  rows={4}
                  className="border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
                  aria-invalid={fieldErrors?.description ? true : undefined}
                />
                <FieldDescription>Máximo 5000 caracteres.</FieldDescription>
                <FieldError
                  errors={
                    fieldErrors?.description
                      ? [{ message: fieldErrors.description }]
                      : undefined
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="durationMinutes">
                  Duración (minutos)
                </FieldLabel>
                <Input
                  id="durationMinutes"
                  name="durationMinutes"
                  type="number"
                  min={1}
                  max={1440}
                  step={1}
                  defaultValue={fields.durationMinutes}
                  required
                  aria-invalid={fieldErrors?.durationMinutes ? true : undefined}
                />
                <FieldError
                  errors={
                    fieldErrors?.durationMinutes
                      ? [{ message: fieldErrors.durationMinutes }]
                      : undefined
                  }
                />
              </Field>
              <div>
                <Button type="submit">Crear servicio</Button>
              </div>
            </FieldGroup>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Servicios</CardTitle>
          <CardDescription>
            Lista de servicios creados recientemente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadError && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
              {loadError}
            </div>
          )}
          {!services ? null : services.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aún no tienes servicios registrados.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {services.map((service) => (
                <li key={service.id} className="rounded-md border p-4">
                  <p className="text-sm font-semibold text-foreground">
                    {service.name}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {service.description || "Sin descripción"}
                  </p>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Duración: {service.durationMinutes} min
                  </p>
                  <Form method="post" className="mt-3 flex items-end gap-2">
                    <input type="hidden" name="serviceId" value={service.id} />
                    <div className="grid gap-2">
                      <FieldLabel htmlFor={`duration-${service.id}`}>
                        Editar duración
                      </FieldLabel>
                      <Input
                        id={`duration-${service.id}`}
                        name="durationMinutes"
                        type="number"
                        min={1}
                        max={1440}
                        step={1}
                        defaultValue={service.durationMinutes}
                        className="w-32"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      name="intent"
                      value="updateDuration"
                    >
                      Guardar
                    </Button>
                  </Form>
                  <div className="mt-3">
                    <Link
                      to={`/p/${userId}/reserve?sid=${service.id}`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                      )}
                    >
                      Link de reserva
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
