# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js 16 template with Better-Auth, Drizzle ORM and PostgreSQL, plus an admin dashboard and security features. The repo also publishes its reusable parts to npm as `@xk2800/nextjs-template` (built with `tsup`, see `tsup.config.ts`, the `exports` map in `package.json` and `PUBLISHING.md`).

**End users scaffold projects with `npx/bunx @xk2800/create-nextjs`** (separate repo, `xk2800/create-nextjs`). It clones this repo at the `v<version>` tag of the latest published package, then replaces every package-provided file with a one-line re-export of the package. Those files are tsup entries, string `.ts` entries in `exports`, and every `.tsx` under the `components/*` **directories** listed in `files`. So:
- Entries under `components/` in `files` can be directories or single `.tsx` files (e.g. `components/site/cookie-banner.tsx`). Single files need create-nextjs with the `statSync` fix; older CLIs crash on them with `ENOTDIR`. So publish that CLI before any template release that adds a single-file entry.
- Behavior that users should be able to change must be configurable (env, `system_settings`, `createAuth()` overrides). Code bundled into `dist/` can't be edited from a scaffolded app.
- Scaffolded projects use this repo's `scripts/doctor.ts` as is (it imports the local `config/env-schema.ts`, so keep that file out of `exports` or the doctor validates against a shim). The CLI rewrites `.env.development` from `.env.development.example` (it fills in `PORT=`, `BASE_URL=`, `BETTER_AUTH_URL=`, `BETTER_AUTH_SECRET=`), so keep those keys as blank `KEY=` lines.

**Full docs live in `docs/content/*.mdx`** (Nextra site, `bun run docs:dev`). Check them before guessing, and keep them current when behavior changes.

**Tech stack:** Next.js 16 (App Router, `proxy.ts`), React 19, TypeScript 6, Drizzle 0.45, Better-Auth 1.7 (admin, twoFactor, passkey and oneTap plugins), Tailwind 4 + shadcn/ui, Resend + React Email, Bun.

## Key Commands

```bash
bun dev                          # dev server
bun run doctor                   # env + DB connection + pending-migration check
bun run test                     # unit tests for pure logic (lib/*.test.ts, scripts/*.test.ts)
bun run typecheck                # tsc against tsconfig.build.json (package files)
bun run generate                 # drizzle migration from server/db/schema.ts
bun run migrate:dev|prod|test    # apply migrations with .env.development|production|test
bun run studio:dev|prod          # Drizzle Studio
bun run <dev|build|start|generate|migrate|studio>:doppler   # same, secrets from Doppler
```

`bun run lint` is currently broken: Next 16 removed `next lint`, and running `eslint .` directly crashes in `@typescript-eslint`.

## Architecture

- **Auth:** `server/auth.ts` exports `createAuth(overrides)`, a factory (only `socialProviders` can be overridden), and `auth`, a lazily built default instance. Its hooks implement the sign-in throttle, live provider kill-switches from `system_settings`, delete-account guards, login and impersonation activity logging, and passkey-change emails. Client: `lib/auth-client.ts`. Server helpers: `lib/auth-helpers.ts` (`getCurrentSession`, `requireAuth`, `requireRole`, `hasRole`, `normalizeCallbackUrl`).
- **Passwords** live in `account.password` (`providerId: "credential"`) with Better-Auth's default hashing (scrypt). `user.password` is an unused legacy column.
- **Sessions:** stored in the database. 30-day expiry, 24h update age, 5-minute cookie cache.
- **Protection layers:** `proxy.ts` runs maintenance mode and a cookie-presence gate on `/dashboard`. Then `app/dashboard/layout.tsx` calls `requireAuth()` (DB check, signs out banned users) and `app/dashboard/admin/layout.tsx` calls `requireRole('admin')`. API routes check the session and role themselves (401/403).
- **System settings:** a single `system_settings` row, cached for 10s in `lib/settings-queries.ts`, seeded from env on first read; after that the DB wins. Effective auth flag = env flag AND DB flag. If the DB is unreachable, settings fail open.
- **DB:** `server/db/index.ts` uses `DB_DRIVER` (`pg` | `neon`) to pick the driver. Tables: `user`, `session`, `account`, `verification`, `twoFactor`, `passkey`, `activity_log`, `device_fingerprint`, `auth_throttle`, `system_settings`. The role column is named **`roles`** in SQL and `role` in TS.
- **Env:** Zod schema in `config/env-schema.ts` (no guard, safe for scripts), parsed and `server-only` in `config/env.ts`. drizzle-kit and `scripts/*` must not import `config/env.ts` or `server/db`.
- **Activity actions:** a new action goes in both `ActivityActionEnum` (`server/db/schema.ts`, needs a migration) and the `ActivityAction` union (`lib/activity-logger.ts`).
- **Package constraints:** components under `components/` ship as raw `.tsx`. Files that ship must use **relative imports, not `@/`**. Server-only modules are tsup entries; anything new that ships must be added to `files`, `exports` (and `typesVersions` for dist entries).

## Workflow

1. Schema change: edit `server/db/schema.ts`, run `bun run generate`, then `bun run migrate:dev`, and commit `server/drizzle/`.
2. Auth change: edit `server/auth.ts`. Custom user fields go in `user.additionalFields` and `better-auth.d.ts`.
3. Any feature added, changed or removed: update the docs (`docs/content/`), `app/features/page.tsx`, `SPEC.md` §5, `data/changelog.json` and `features-test.md` in the same change.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
