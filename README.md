# Next.js Template

A production-ready Next.js 16 starter: Better-Auth (email/password, Google, One Tap, passkeys, TOTP 2FA), Drizzle + PostgreSQL, an admin dashboard, security features and shadcn/ui. Its reusable parts are also published as the npm package [`@xk2800/nextjs-template`](#using-as-a-package).

**📚 Full documentation:** [`docs/content`](docs/content), or run it locally with `bun run docs:dev` (<http://localhost:3001>).

## Quick start

Requires [Bun](https://bun.sh) and a PostgreSQL database.

```bash
git clone https://github.com/xk2800/nextjs-template.git && cd nextjs-template
bun install
cp .env.development.example .env.development   # set DATABASE_URL, BETTER_AUTH_URL, NEXT_PUBLIC_APP_URL, BETTER_AUTH_SECRET
bun run migrate:dev
bun run doctor                                  # checks env, DB connection, pending migrations
bun dev
```

Sign up at <http://localhost:3000>, then make yourself an admin:

```sql
UPDATE "user" SET roles = 'admin' WHERE email = 'you@example.com';
```

## Features

- **Auth:** email/password, Google OAuth, Google One Tap, passkeys, TOTP 2FA with backup codes, password reset, email verification
- **Security:** new-device email alerts, per-device sign-in/sign-up throttle, active-session revocation, self-serve account deletion, cookie-consent banner
- **Admin:** user management (roles, bans, bulk actions, CSV export), impersonation, system-wide activity log, device-security cards, live auth toggles, maintenance mode
- **Ops:** `bun run doctor`, Docker image, Doppler support, separate env files for dev, prod and test

## Docs

| Topic | |
|---|---|
| Every env var, env vs. admin settings, Doppler | [Configuration](docs/content/configuration.mdx) |
| Folder layout, request flow, adding protected pages/routes | [Architecture](docs/content/architecture.mdx) |
| Tables, column gotchas, migrations | [Database](docs/content/database.mdx) |
| Providers, sessions, helpers, client usage | [Authentication](docs/content/authentication.mdx) |
| 2FA, passkeys, device alerts, throttle, cookie consent | [Security Features](docs/content/security.mdx) |
| Admin dashboard, impersonation, maintenance mode | [Admin & Maintenance](docs/content/admin.mdx) |
| Every route, body and guard | [API Reference](docs/content/api.mdx) |
| UI, auth, dashboard and email components | [Components](docs/content/components.mdx) |
| Installing the npm package | [Using as a Package](docs/content/npm-package.mdx) |
| Production checklist, migrations, Docker | [Deployment](docs/content/deployment.mdx) |
| Common errors and fixes | [Troubleshooting](docs/content/troubleshooting.mdx) |

## Using as a package

```bash
bun add @xk2800/nextjs-template
```

```ts
// next.config.ts — components ship as raw .tsx
const nextConfig = { transpilePackages: ["@xk2800/nextjs-template"] }
```

```css
/* app/globals.css */
@import "tailwindcss";
@import "@xk2800/nextjs-template/styles/theme.css";
@source "../node_modules/@xk2800/nextjs-template";
```

```ts
// app/api/auth/[...all]/route.ts
import { auth } from "@xk2800/nextjs-template/auth"
import { toNextJsHandler } from "better-auth/next-js"
export const { GET, POST } = toNextJsHandler(auth)
```

Peer dependencies, the full import list, migrations, adding providers and One Tap are covered in **[Using as a Package](docs/content/npm-package.mdx)**.

## Common scripts

| | |
|---|---|
| `bun dev` | Dev server |
| `bun run doctor` | Check env, DB and migrations |
| `bun run generate` | Generate a migration from `server/db/schema.ts` |
| `bun run migrate:dev` / `:prod` / `:test` | Apply migrations |
| `bun run studio:dev` | Drizzle Studio |
| `bun run test` | Unit tests |
| `bun run *:doppler` | Any of the above with secrets from Doppler |

Maintainers: publishing steps are in [PUBLISHING.md](PUBLISHING.md).
