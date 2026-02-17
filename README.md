# Cuádralo

Aplicación full‑stack (SSR) construída con **React Router v7**, desplegada en **Cloudflare Workers**, y respaldada por **PostgreSQL** (Neon) + **Drizzle ORM**. La autenticación en tiempo de ejecución usa **Clerk**. Esta app incluye una entidad `services` con políticas y ejemplos de rutas protegidas, carga de datos y formularios.

---

## 🚀 Resumen rápido

- Runtime: **Cloudflare Workers (SSR)**
- DB: **PostgreSQL (Neon)**
- ORM: **Drizzle ORM**
- UI: **Tailwind CSS v4** + **shadcn/ui** + **Hugeicons**
- Autenticación: **Clerk**

---

## Características principales

- Renderizado del lado servidor (Cloudflare Workers)
- Autenticación con **Clerk** y acceso a datos mediante **Drizzle**
- Esquema y migraciones con **Drizzle**
- Interfaz con componentes reutilizables (shadcn/ui)

---

## Requisitos

- Node.js (preferible v18+)
- pnpm (se recomienda la versión indicada en `package.json`)
- Wrangler CLI (para desplegar en Cloudflare)

---

## Configuración rápida (desarrollo)

1. Instala dependencias:

   ```bash
   pnpm install
   ```

2. Variables de entorno / bindings (configurar en Cloudflare/Wrangler o `.env` para local):
   - `DATABASE_URL` — URL de la base de datos PostgreSQL (Neon)
   - `CLERK_SECRET_KEY` — clave secreta de Clerk (server)
   - `CLERK_PUBLISHABLE_KEY` — clave pública de Clerk (cliente)

   > ⚠️ No subas el archivo `.env` ni claves al repositorio.

3. Genera tipos y valida tipos TypeScript (recomendado antes de compilar):

   ```bash
   pnpm cf-typegen    # generar tipos de Cloudflare (wrangler)
   pnpm typecheck     # ejecutar TypeScript checks
   ```

4. Ejecuta el servidor de desarrollo:

   ```bash
   pnpm dev
   ```

   Accede a la app en `http://localhost:5173` (por defecto).

---

## Base de datos & migraciones

- Migraciones y esquema con **Drizzle** (carpeta `drizzle/`):
  - Generar migración: `pnpm db:generate`
  - Aplicar migraciones: `pnpm db:migrate`
  - Forzar esquema: `pnpm db:push`
  - Abrir Drizzle Studio: `pnpm db:studio`

- Esquema relevante: `app/core/db/schema.server.ts` (políticas/controles para `services`).

---

## Arquitectura y convenciones importantes

- Rutas: definidas en `app/routes.ts` (routing basado en configuración).
- Contextos compartidos (use AsyncLocalStorage):
  - `CLOUDFLARE` — env / ExecutionContext
  - `DATABASE` — cliente/connection pool para Postgres (Drizzle)
  - `AUTH` — proveedor de autenticación (Clerk) en runtime
  - Archivo: `app/core/context.server.ts`
- Middleware de autenticación: `app/middleware/auth.ts` (áreas privadas en `app/routes/private.tsx`).

> 💡 En loaders y actions, usa `CLOUDFLARE.get()`, `DATABASE.get()` y `AUTH.get()` en lugar de pasar configuraciones por props.

---

## Scripts útiles

- `pnpm dev` — servidor de desarrollo (HMR)
- `pnpm build` — build de producción
- `pnpm preview` — build + preview local
- `pnpm deploy` — build + `wrangler deploy`
- `pnpm cf-typegen` — generar tipos de Cloudflare (wrangler)
- `pnpm db:generate` / `db:migrate` / `db:push` / `db:studio` — Drizzle
- `pnpm typecheck` — genera tipos y ejecuta TypeScript
- `pnpm ui:add` — añadir componente shadcn/ui

---

## Cómo añadir una nueva ruta (rápido)

1. Registrar la ruta en `app/routes.ts`.
2. Crear el archivo de la ruta en `app/routes/` (p. ej. `app/routes/nueva-ruta.tsx`).
3. Si la ruta debe estar protegida, aplicar el middleware de auth desde `app/routes/private.tsx`.

---

## Despliegue

- Deploy por Wrangler (Cloudflare Workers):

  ```bash
  pnpm deploy
  ```

- Asegúrate de configurar variables de entorno/secretos en el dashboard de Cloudflare o en `wrangler` antes de desplegar.

---

## Seguridad y buenas prácticas

- No comitees `.env` ni credenciales.
- Las políticas y validaciones están definidas en `app/core/db/schema.server.ts` — verifica cambios en migraciones.

---

## Recursos

- React Router: https://reactrouter.com/
- Clerk: https://clerk.com/
- Neon (Postgres): https://neon.tech/
- Drizzle ORM: https://orm.drizzle.team/
- Tailwind CSS: https://tailwindcss.com/
- shadcn/ui: https://ui.shadcn.com/

---

## Estado

- Proyecto listo para desarrollo local y despliegue en Cloudflare Workers.
- Tabla principal: `services` (ver `app/routes/home.tsx` y `app/services/service.ts`).

---

## Contribuir

Abre un PR, sigue las convenciones de commits y actualiza/crea migraciones si cambias el esquema.

---

**Licencia**: MIT (ajusta según corresponda)
