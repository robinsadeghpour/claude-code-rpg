# Next.js Boilerplate

Production-ready Next.js monorepo starter. Auth, billing, database, email, and storage — all wired up.

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Monorepo:** Turborepo + pnpm workspaces
- **API:** Hono (mounted via Next.js catch-all route)
- **Auth:** BetterAuth (email/password, magic link, OAuth, API keys)
- **Database:** PostgreSQL via Prisma 7
- **Billing:** Stripe (checkout, portal, webhooks)
- **Mail:** Nodemailer + Resend + react-email
- **Storage:** S3-compatible (presigned URLs)
- **Linting:** Biome
- **Styling:** Tailwind CSS + ShadCN

## Structure

```
apps/web          — Next.js frontend (App Router)
packages/api      — Hono API server
packages/auth     — BetterAuth config
packages/database — Prisma schema + queries
packages/stripe   — Stripe billing
packages/mail     — Email templates
packages/storage  — S3 client
packages/logs     — Logger (Consola)
packages/utils    — Utilities
config/           — App-wide config
tooling/          — Shared TypeScript + Tailwind configs
```

## Getting Started

1. Clone this repo
2. `cp .env.example .env.local` and fill in values
3. `pnpm install`
4. `cd packages/database && pnpm migrate && pnpm generate`
5. `pnpm dev`

## Common Commands

```bash
pnpm dev        # Start all apps
pnpm build      # Build everything
pnpm lint       # Biome check
pnpm lint:fix   # Biome fix
pnpm format     # Biome format
```

## Customizing

1. **App name:** Find/replace `My App` and `myapp` with your product name
2. **API key prefix:** Update `apiKeyPrefix` in `config/index.ts`
3. **Pricing:** Update `config/index.ts` payments section
4. **Nav:** Edit `apps/web/modules/shared/components/app-sidebar.tsx`
5. **Schema:** Add your models to `packages/database/prisma/schema.prisma`, then run `pnpm migrate && pnpm generate` in `packages/database`
6. **Vercel preview pattern:** Update `VERCEL_PREVIEW_PATTERN` in `packages/auth/auth.ts`
