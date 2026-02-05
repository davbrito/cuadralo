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
import { SUPABASE } from "@/context";
import { Form, data } from "react-router";
import type { Route } from "./+types/home";

export async function loader() {
  const supabase = SUPABASE.get();
  const { data: services, error } = await supabase
    .from("services")
    .select("id, name, description, created_at")
    .order("created_at", { ascending: false });

  return {
    services: services ?? [],
    loadError: error?.message ?? null,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  const fieldErrors: {
    name?: string;
    description?: string;
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

  if (Object.keys(fieldErrors).length > 0) {
    return data(
      {
        ok: false,
        fieldErrors,
        fields: { name, description },
      },
      { status: 400 },
    );
  }

  const supabase = SUPABASE.get();
  const { error } = await supabase
    .from("services")
    .insert({ name, description })
    .select("id")
    .single();

  if (error) {
    return data(
      {
        ok: false,
        formError: "No se pudo crear el servicio. Intenta de nuevo.",
        fields: { name, description },
      },
      { status: 500 },
    );
  }

  return data({ ok: true, success: "Servicio creado correctamente." });
}

export default function Home({ loaderData, actionData }: Route.ComponentProps) {
  const { services, loadError } = loaderData;
  const action = actionData ?? undefined;
  const fields =
    action && "fields" in action
      ? action.fields
      : { name: "", description: "" };
  const fieldErrors =
    action && "fieldErrors" in action ? action.fieldErrors : undefined;
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
          {services.length === 0 ? (
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
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
