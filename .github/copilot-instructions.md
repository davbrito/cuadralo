# Copilot instructions — Cuádralo

## Project at a glance
- Full-stack SSR app with React Router v7 on Cloudflare Workers.
- Auth uses Clerk (`@clerk/react-router`).
- Runtime DB access uses Drizzle ORM + Neon serverless Postgres.
- UI stack: Tailwind v4, shadcn-style UI components in `app/components/ui`, Hugeicons.

## Code Style
- TypeScript strict config is the default (`tsconfig.json`, `tsconfig.cloudflare.json`, `tsconfig.node.json`).
- Follow existing ESLint flat config in `eslint.config.ts` and current component patterns.
- Use import alias `@/*` for `app/*`.

## Architecture
- Routes are config-based in `app/routes.ts`.
- Request-scoped DI uses AsyncLocalStorage contexts from `app/core/context.server.ts`.
- Worker entry (`workers/app.ts`) initializes and injects `CLOUDFLARE` and `DATABASE` contexts.
- Auth guard is in `app/middleware/auth.ts`; private area middleware is exported from `app/routes/private.tsx`.
- Data logic belongs in `app/services` (example: `app/services/service.ts`).

## Build and Test
- Install: `pnpm install`
- Dev: `pnpm dev`
- Build: `pnpm build`
- Preview: `pnpm preview`
- Deploy: `pnpm deploy`
- Cloudflare types: `pnpm cf-typegen`
- Typecheck: `pnpm typecheck`
- DB: `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:push`, `pnpm db:studio`
- Add shadcn component: `pnpm ui:add`
- There is currently no `test` script in `package.json`.

## Project Conventions
- In server code, always read dependencies from contexts (`DATABASE.get()`, `AUTH.get()`, `CLOUDFLARE.get()`).
- Do not pass env/config through React props when context is available.
- Keep schema definitions in `app/core/db/schema.server.ts` and mirror changes via Drizzle migrations in `drizzle/`.
- Keep route protection in middleware, not inside UI components.

## Integration Points
- Cloudflare env bindings are typed in `worker-configuration.d.ts` (`DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`).
- Clerk is configured in `app/root.tsx` and used by auth middleware/routes.
- Supabase files may exist, but active runtime auth/data flow is Clerk + Drizzle/Neon.

## Security
- Never use `process.env` in runtime server code; use Cloudflare bindings via context.
- Do not hardcode cookie/auth secrets; use environment secrets.
- Preserve auth checks in middleware for all private routes.