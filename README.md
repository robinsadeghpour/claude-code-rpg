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
- **AI Chat:** Vercel AI SDK + assistant-ui (Claude, web search, memory)
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
packages/ai       — AI model config (Claude via AI SDK gateway)
packages/ai-chat  — Chat orchestrator, tools, title generation
packages/memory   — Mem0 integration (optional)
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

## AI Chat (Optional)

The `/chat` page provides a streaming AI chat with persistent history. All features are opt-in based on environment variables:

| Feature | Env var | Description |
|---------|---------|-------------|
| Chat (required) | `AI_GATEWAY_API_KEY` | AI SDK gateway key for Claude models |
| Web search | `TAVILY_API_KEY` | Enables the web search tool |
| Memory | `MEM0_API_KEY` | Enables memory storage/search tools |

Without any keys, the chat page renders but won't function. With just `AI_GATEWAY_API_KEY`, you get plain chat. Add the other keys to progressively enable tools.

The chat uses:
- **Backend:** `packages/ai-chat` orchestrator with `streamText()`, auto-generated titles
- **Frontend:** `@assistant-ui/react` components at `apps/web/modules/ui/components/assistant-ui/`
- **Database:** `Chat` and `ChatMessage` models in Prisma

## Customizing

1. **App name:** Find/replace `My App` and `myapp` with your product name
2. **API key prefix:** Update `apiKeyPrefix` in `config/index.ts`
3. **Pricing:** Update `config/index.ts` payments section
4. **Nav:** Edit `apps/web/modules/shared/components/app-sidebar.tsx`
5. **Schema:** Add your models to `packages/database/prisma/schema.prisma`, then run `pnpm migrate && pnpm generate` in `packages/database`
6. **Vercel preview pattern:** Update `VERCEL_PREVIEW_PATTERN` in `packages/auth/auth.ts`
