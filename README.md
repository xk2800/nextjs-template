This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

This is a template for Next.js projects using Drizzle ORM, self hosted PostgreSQL for development and Neon DB for production.

## Basic Folder Structure

```plaintext {5}
📦 <project root>
├── 📂 server/
│   ├── 📂 db/
│   │   ├── 📜 schema.ts
│   │   └── 📜 index.ts
│   ├── 📂 drizzle/
│   ├── 📜 auth.ts
│   └── 📂 test-connection/
│       └── 📜 index.ts
├── 📜 .env.production
├── 📜 .env.development
├── 📜 drizzle.config.ts
├── 📜 package.json
└── 📜 tsconfig.json
```

## Getting Started

1. Install the packages:

```bash
bun install
```

2. Setup the `.env.development` and `.env.production` files based on `.env.development.example` and `.env.production.example` respectively.

   **Important:** Generate an `AUTH_SECRET` using:
   ```bash
   openssl rand -base64 32
   ```

## Migrating Schema

1. Generating schema, running this one command works for development and production modes `bun run generate`

2. Migrating schema into:

```bash
# development
bun run migrate:dev

# production
bun run migrate:prod
```

## Testing Connection

1. To test and ensure that the connection and database works, run:

```bash
# development
bun --env-file=.env.development server/test-connection/index.ts

# production
bun --env-file=.env.production server/test-connection/index.ts
```

## Features

1. Basic Next.js + Tailwind CSS boilerplate
2. Shadcn/ui
3. NextAuth with Google OAuth
4. Basic login flow using NextAuth
5. Connection template to a postgresql database for development, testing and production

## WIP

1. Migrating NextAuth to BetterAuth

## Using this as a package

This repo also publishes its reusable auth/db/UI pieces as a private npm package, `@xk2800/nextjs-template`, to GitHub Packages. Use this in new projects instead of copy-pasting the whole template.

### 1. Registry auth

Create a `.npmrc` in your new project:

```ini
@xk2800:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Export a `GITHUB_TOKEN` with `read:packages` scope in your shell environment (do not hardcode it in `.npmrc`).

### 2. Install

```bash
bun add @xk2800/nextjs-template
```

This has peer dependencies on `next`, `react`, `react-dom`, and the Radix/shadcn packages the UI components use (`@radix-ui/react-*`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `react-icons`). If your project already uses shadcn/ui, these are typically already installed.

### 3. Enable `transpilePackages`

UI components ship as raw `.tsx` source so `'use client'` boundaries survive. Add this to your `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  transpilePackages: ["@xk2800/nextjs-template"],
}
```

### 4. Tailwind theme + content scanning

The UI components use shadcn's CSS variable-based theme (`bg-primary`, `border-input`, etc.) and Tailwind v4 doesn't scan `node_modules` for class names by default. Add both to your `app/globals.css`, after the existing `@import "tailwindcss";`:

```css
@import "tailwindcss";
@import "@xk2800/nextjs-template/styles/theme.css";
@source "../node_modules/@xk2800/nextjs-template";
```

If you use `Dialog`, `AlertDialog`, or `DropdownMenu`, also install and import `tw-animate-css` for their open/close transitions — without it they still work, just without animation.

### 5. Import what you need

```ts
import { auth } from "@xk2800/nextjs-template/auth"
import { requireAuth, hasRole } from "@xk2800/nextjs-template/auth/helpers"
import { authClient, useSession } from "@xk2800/nextjs-template/auth-client"
import { db } from "@xk2800/nextjs-template/db"
import { users, sessions } from "@xk2800/nextjs-template/db/schema"
import { config } from "@xk2800/nextjs-template/config/env"
import { LoginSchema } from "@xk2800/nextjs-template/types/auth/loginSchema"
import { Button } from "@xk2800/nextjs-template/components/ui/button"
import AuthCard from "@xk2800/nextjs-template/components/auth/authCard"
```

### 6. Not importable — copy these patterns instead

`app/api/auth/[...all]/route.ts` and `middleware.ts` are Next.js file-convention code, not library exports. Copy the pattern into your own project:

```ts
// app/api/auth/[...all]/route.ts
import { auth } from "@xk2800/nextjs-template/auth"
import { toNextJsHandler } from "better-auth/next-js"

export const { GET, POST } = toNextJsHandler(auth)
```

### 7. Database migrations

The package does not ship migrations. drizzle-kit needs a local file it can import directly (it can't resolve package `exports` subpaths reliably), so add a one-line re-export in your own project:

```ts
// server/db/schema.ts
export * from "@xk2800/nextjs-template/db/schema"
```

Then point `drizzle.config.ts` at it, reading `DATABASE_URL` from `process.env` directly rather than importing `@xk2800/nextjs-template/config/env` — that module is guarded with `server-only`, which throws when resolved outside Next.js's own bundler (drizzle-kit runs via plain Node/esbuild, so the guard fires unconditionally there):

```ts
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './server/drizzle',
  schema: './server/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
})
```
