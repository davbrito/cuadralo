# Cuádralo

Aplicación full‑stack (SSR) construída con **React Router v7**, desplegada en **Cloudflare Workers**, y respaldada por **Supabase** + **Drizzle ORM**. Esta app incluye una entidad `services` con RLS configurado y ejemplos de rutas protegidas, carga de datos y formularios.

---

## 🚀 Resumen rápido

- Runtime: **Cloudflare Workers (SSR)**
- DB: **PostgreSQL (Supabase)**
- ORM: **Drizzle ORM**
- UI: **Tailwind CSS v4** + **shadcn/ui** + **Hugeicons**
- Autenticación: **Supabase Auth**

---

## Características principales

- Renderizado del lado servidor (Cloudflare Workers)
- Autenticación y RLS (Supabase + Drizzle)
- Esquema y migraciones con **Drizzle**
- Tipado y generación de tipos para Supabase & Cloudflare
- Interfaz con componentes reutilizables (shadcn/ui)

---

## Requisitos

- Node.js (preferible v18+)
- pnpm (se recomienda la versión indicada en `package.json`)
- Wrangler CLI (para desplegar en Cloudflare)
- (Opcional) Supabase CLI para desarrollo local de la base de datos

---

## Configuración rápida (desarrollo)

1. Instala dependencias:

   ```bash
   pnpm install
   ```

2. Variables de entorno (crear `.env` o configurar en tu entorno):

   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_PUBLISHABLE_KEY` (opcional para cliente)
   - `DATABASE_URL` (si ejecutas migraciones localmente)

   > ⚠️ No subas el archivo `.env` al repositorio.

3. Genera tipos y metadatos (recomendado antes de compilar):

   ```bash
   pnpm sb-typegen    # genera supabase.types.d.ts
   pnpm cf-typegen    # wrangler types
   pnpm typecheck     # ejecuta typegen y tsc
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

- Esquema relevante: `app/db/schema.ts` (políticas RLS para `services`).

---

## Arquitectura y convenciones importantes

- Rutas: definidas en `app/routes.ts` (routing basado en configuración).
- Contextos compartidos (use AsyncLocalStorage):
  - `CLOUDFLARE` — env / ExecutionContext
  - `SUPABASE` — cliente Supabase en servidor
  - `USER` — usuario autenticado
  - Archivo: `app/context.ts`
- Middleware de autenticación: `app/middleware/auth.ts` (`privateMiddleware`).
- Cliente Supabase (browser): `app/lib/client/supabase.client.ts`.

> 💡 Usa `CLOUDFLARE.get()`, `SUPABASE.get()` y `USER.get()` en loaders/actions en lugar de pasar props manualmente.

---

## Scripts útiles

- `pnpm dev` — servidor de desarrollo (HMR)
- `pnpm build` — build de producción
- `pnpm preview` — build + preview local
- `pnpm deploy` — build + `wrangler deploy`
- `pnpm cf-typegen` — generar tipos de Cloudflare (wrangler)
- `pnpm sb-typegen` — generar tipos de Supabase
- `pnpm db:generate` / `db:migrate` / `db:push` / `db:studio` — Drizzle
- `pnpm typecheck` — genera tipos y ejecuta TypeScript
- `pnpm ui:add` — añadir componente shadcn/ui

---

## Cómo añadir una nueva ruta (rápido)

1. Registrar la ruta en `app/routes.ts`.
2. Crear el archivo de la ruta en `app/routes/` (p. ej. `app/routes/nueva-ruta.tsx`).
3. Si la ruta debe estar protegida, aplicar `privateMiddleware` o importar `middleware` desde `app/routes/private.tsx`.

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
- Las políticas RLS están definidas en `app/db/schema.ts` — verifica cambios en migraciones.
- Usa `pnpm sb-typegen` después de cambios en el esquema de Supabase.

---

## Recursos

- React Router: https://reactrouter.com/
- Supabase: https://supabase.com/
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
