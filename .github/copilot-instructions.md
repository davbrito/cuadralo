# Copilot Instructions for Cuádralo

## Project Overview

Cuádralo is a full-stack application built with **React Router v7** deployed on **Cloudflare Workers**. It uses **Supabase** for the database and authentication, **Drizzle ORM** for data access, and **Tailwind CSS** with **shadcn/ui** for the frontend.

## Architecture

### Core Stack

- **Framework:** React Router v7 (Config-based routing via `app/routes.ts`).
- **Runtime:** Cloudflare Workers (SSR).
- **Database:** PostgreSQL (Supabase).
- **ORM:** Drizzle ORM (`drizzle-orm/supabase` for RLS policies).
- **Styling:** Tailwind CSS v4, shadcn/ui.

### Context & Dependency Injection

The application relies on `AsyncLocalStorage` to share context across the request lifecycle.

- **File:** `app/context.ts`
- **Contexts:**
  - `CLOUDFLARE` (Env, ExecutionContext)
  - `SUPABASE` (SupabaseClient)
  - `USER` (Authenticated User)
- **Usage:** Always use `CLOUDFLARE.get()`, `SUPABASE.get()`, or `USER.get()` in loaders/actions/middleware instead of passing props down manually.

### Routing & Middleware

- **Configuration:** Routes are defined in `app/routes.ts` (not filesystem-based).
- **Middleware:**
  - `app/middleware/supabase.ts` initializes the Supabase client and manages cookies.
  - `app/middleware/auth.ts` (`privateMiddleware`) protects routes and populates the `USER` context.

## Conventions & Patterns

### Imports & Aliases

(defined in `tsconfig.cloudflare.json`):

- Use `@/*` for `app/*` root.

### Database (Drizzle ORM)

- **Schema:** Defined in `app/db/schema.ts`.
- **RLS:** Use `pgTable.withRLS` and helpers from `drizzle-orm/supabase` (`authUsers`, `authUid`) to define Row Level Security policies directly in the schema.
- **Validation:** Use `check` constraints in the schema for data integrity.

### UI Components (shadcn/ui)

- **Adding Components:**.
  1. Add the component:
     ```bash
     pnpm ui:add [component-name]
     ```

### Authentication

- Authentication is handled by Supabase.
- Routes are protected via `privateMiddleware` in `app/middleware/auth.ts`.
- Access the current user via `USER.get()` in server-side code.

## Developer Workflow

### Scripts

- **Dev Server:** `pnpm dev`
- **Type Generation:**
  - Cloudflare types: `pnpm cf-typegen`
  - Supabase types: `pnpm sb-typegen`
- **Build:** `pnpm build`
- **Deploy:** `pnpm deploy`

### Database Migrations

- Schema changes are managed via Drizzle.
- Migrations are stored in `drizzle/`.

## Common Tasks

### Creating a New Route

1. Define the route in `app/routes.ts`.
2. Create the file in `app/routes/`.
3. If protected, import and add `middleware` from `app/routes/private.tsx` (or import `privateMiddleware` directly).

### Accessing Environment Variables

Do not use `process.env`. Use the context:

```typescript
import { CLOUDFLARE } from "@/context";
const { env } = CLOUDFLARE.get();
```
