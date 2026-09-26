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

## Secrets management with Doppler (optional)

`.env.*` files work as described above by default. If you'd rather manage secrets in [Doppler](https://doppler.com) instead of local `.env` files, that's supported as an opt-in alternative — every `*:doppler` script does the same thing as its `.env`-based counterpart, just sourcing secrets from Doppler instead:

```bash
bun run dev:doppler        # instead of bun run dev
bun run build:doppler       # instead of bun run build
bun run start:doppler       # instead of bun run start
bun run generate:doppler    # instead of bun run generate
bun run migrate:doppler     # instead of bun run migrate:dev / migrate:prod / migrate:test
bun run studio:doppler      # instead of bun run studio:dev / studio:prod
```

Setup (one-time, per machine):

```bash
brew install dopplerhq/cli/doppler   # or see https://docs.doppler.com/docs/install-cli
doppler login
doppler setup                        # run in the project root; select your Doppler project + config
```

`doppler setup` writes a `doppler.yaml` that maps this directory to a Doppler project/config — it holds no secrets itself, so it's safe to commit. `doppler run -- <command>` injects your Doppler secrets into `process.env` before the command starts; nothing in `config/env.ts` or `drizzle.config.ts` needed to change, since they just read `process.env` regardless of where it came from. Both Next.js and Bun treat already-set `process.env` values as higher priority than `.env` file values, so this layers safely even if `.env.development` is also present.

To target a specific Doppler config without re-running `doppler setup` (e.g. in CI), pass `--config`: `doppler run --config prd -- bun run migrate:doppler`.

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
3. Better-Auth with Google OAuth + email/password
4. Basic login flow using Better-Auth
5. Connection template to a postgresql database for development, testing and production
6. Two-factor auth (TOTP + backup codes) and passkeys (WebAuthn), managed from the dashboard Settings page
7. Password reset and self-serve email verification, both via Resend-delivered React Email templates
8. Security email alerts — new-device sign-ins and passkey add/remove, mirrored to the activity log
9. Cookie-consent banner — "Necessary only" / "Accept all", with a "Cookie settings" link in the footer to change it later. The device fingerprint and Google One Tap only run after "Accept all"

## WIP

1. Nothing in flight

## Using this as a package

This repo also publishes its reusable auth/db/UI pieces as a public npm package, `@xk2800/nextjs-template`, to the npm registry. Use this in new projects instead of copy-pasting the whole template.

### 1. Install

```bash
bun add @xk2800/nextjs-template
```

This has peer dependencies on `next`, `react`, `react-dom`, and the Radix/shadcn packages the UI components use (`@radix-ui/react-*`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `react-icons`). If your project already uses shadcn/ui, these are typically already installed. Three more peer deps are optional, only needed if you use the specific feature: `next-themes` (theme toggle/provider), `sonner` (dashboard session-revoke toasts), `@react-email/components` (email templates).

### 2. Enable `transpilePackages`

UI components ship as raw `.tsx` source so `'use client'` boundaries survive. Add this to your `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  transpilePackages: ["@xk2800/nextjs-template"],
};
```

### 3. Tailwind theme + content scanning

The UI components use shadcn's CSS variable-based theme (`bg-primary`, `border-input`, etc.) and Tailwind v4 doesn't scan `node_modules` for class names by default. Add both to your `app/globals.css`, after the existing `@import "tailwindcss";`:

```css
@import "tailwindcss";
@import "@xk2800/nextjs-template/styles/theme.css";
@source "../node_modules/@xk2800/nextjs-template";
```

If you use `Dialog`, `AlertDialog`, or `DropdownMenu`, also install and import `tw-animate-css` for their open/close transitions — without it they still work, just without animation.

### 4. Adding a social provider (e.g. Apple) in one project only

`auth` is the package's default instance (Google + email/password). To add another provider in a specific project — without forking the template — use the `createAuth` factory. This needs three changes, all in your own project, none in the package.

**a. Create your own `server/auth.ts`** that wraps the factory:

```ts
// server/auth.ts (your project, not the package)
import { createAuth } from "@xk2800/nextjs-template/auth";

export const auth = createAuth({
  socialProviders: {
    apple: {
      clientId: process.env.APPLE_CLIENT_ID!, // your Apple Services ID
      clientSecret: process.env.APPLE_CLIENT_SECRET!, // generated signed JWT, not a static secret
      appBundleIdentifier: process.env.APPLE_APP_BUNDLE_IDENTIFIER!, // only if you also support native/iOS sign-in
    },
  },
});
```

The `socialProviders` you pass are **merged** with the default `google` provider, not a replacement — `auth.socialProviders` ends up as `{ google, apple }`. Other config (session policy, password hashing, schema wiring) isn't exposed as an override; those stay fixed since they're shared assumptions, not per-project knobs.

**b. Point your API route at your own `auth`, not the package's:**

```ts
// app/api/auth/[...all]/route.ts
import { auth } from "@/server/auth"; // your local file from step a — not "@xk2800/nextjs-template/auth"
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

If you skip this and leave the route importing the package's `auth` directly, the server will never see your `apple` provider — the route handler is what actually serves the OAuth callback, so it has to be backed by the instance you customized.

**c. Trigger it client-side.** The shipped `components/auth/socialLogin.tsx` is hardcoded to Google only (it's meant as a starting point, not a generic multi-provider switcher) — it won't grow an Apple button on its own. Add your own trigger using the same `authClient` the package already exports:

```tsx
"use client";
import { Button } from "@xk2800/nextjs-template/components/ui/button";
import { authClient } from "@xk2800/nextjs-template/auth-client";

export function AppleSignInButton({ callbackUrl }: { callbackUrl?: string }) {
  return (
    <Button variant="outline" className="w-full" onClick={() => authClient.signIn.social({ provider: "apple", callbackURL: callbackUrl || "/dashboard" })}>
      Sign in with Apple
    </Button>
  );
}
```

Nothing else needs to change — `middleware.ts`, `auth/helpers` (`requireAuth`, `hasRole`), and `auth-client`'s `useSession` are all provider-agnostic; they work off the session cookie/token, not which provider created it.

#### Disabling Google or email/password instead

Going the other way — turning **off** Google or email/password in one project — doesn't need `createAuth()` at all. Both providers are gated by env vars read from `config/env.ts`, which the package's `auth` singleton, the shipped `/login` and `/signup` pages, and any project that imports `@xk2800/nextjs-template/config/env` all read from the same place:

```bash
# .env.* in your project (not the package) — either or both, default is true
AUTH_ENABLE_GOOGLE=false
AUTH_ENABLE_EMAIL_PASSWORD=false
```

Setting one to `false` removes it from the Better-Auth config server-side (not just from the UI) — a disabled provider's endpoints won't authenticate anyone, even if called directly. The shipped login/signup pages hide the corresponding button/form automatically since they read the same flags.

**Setting both `AUTH_ENABLE_GOOGLE=false` and `AUTH_ENABLE_EMAIL_PASSWORD=false` only fails if you haven't added a replacement provider.** `createAuth()` checks the *final* merged provider list — after your own `overrides.socialProviders` (per the section above) is applied — and throws only if that list is genuinely empty and email/password is also off. So:

- Both flags `false`, no override → throws. There would be zero ways to sign in.
- Both flags `false`, `createAuth({ socialProviders: { apple: {...} } })` → works fine. Apple is your only provider, and that's a valid config.

This check lives in `createAuth()`, not `config/env.ts` — `config/env.ts` can't see overrides (they're only known at `createAuth()` call time), so it doesn't gate this at all. It only throws for the package's own default `auth` export (used by the shipped `/login`, `/signup`, and `app/api/auth/[...all]/route.ts`) if *that* ends up providerless, since that instance never has overrides.

#### Enabling Google One Tap

[Google One Tap](https://better-auth.com/docs/plugins/one-tap) is off by default and needs **two** flags, not one — `config/env.ts` is server-only (`import "server-only"`), so `lib/auth-client.ts` and the shipped `components/auth/oneTap.tsx` can't read it. The public flag is what actually gets inlined into your browser bundle; the server one only controls whether the Better-Auth server registers the plugin.

```bash
# .env.* in your project — both default to false
AUTH_ENABLE_ONE_TAP=true
NEXT_PUBLIC_AUTH_ENABLE_ONE_TAP=true

# needed either way — same OAuth client as AUTH_GOOGLE_ID, but public
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```

One Tap also requires Google to be enabled (`AUTH_ENABLE_GOOGLE=true`, the default) — the server silently skips registering the plugin if Google isn't configured, rather than throwing, since email/password-only projects are a valid config.

Mount the shipped component once, anywhere it should be able to prompt (root layout is typical):

```tsx
import OneTap from "@xk2800/nextjs-template/components/auth/oneTap";
```

`<OneTap />` self-gates on `NEXT_PUBLIC_AUTH_ENABLE_ONE_TAP` and on the current session (`useSession`), so it's safe to leave mounted permanently — it no-ops for signed-in users and for any project that hasn't turned the flag on, no conditional JSX needed on your end. Toggling the feature later is just flipping both env vars, no code changes.

Your Google Cloud OAuth client also needs its **Authorized JavaScript origins** to include whatever origin you're testing/deploying from (e.g. `http://localhost:3000`) — One Tap validates the origin client-side, separately from the OAuth redirect URIs you already set up.

**One Tap waits for cookie consent.** It only prompts once the visitor clicks "Accept all" in the cookie banner (see below). If you import `<OneTap />` without mounting `<CookieBanner />`, set `NEXT_PUBLIC_COOKIE_BANNER=false`. Otherwise nobody can consent and the prompt never shows.

#### Cookie-consent banner

On by default. `<CookieBanner />` (mounted in `app/layout.tsx`) asks once and stores the answer in the first-party `cookie_consent` cookie (`all` | `necessary`, 1 year). `<CookieSettingsButton />` (in the site footer) clears the answer so the banner comes back. Auth/session cookies and UI preferences are "necessary" and always on. Optional, and only after "Accept all":

- **FingerprintJS device id**: `getVisitorId()` in `lib/device-fingerprint.ts` returns `null` without consent. New-device alerts are then skipped, and the sign-in/sign-up throttle falls back to its per-IP cap.
- **Google One Tap**: see above.

```tsx
import { CookieBanner, CookieSettingsButton } from "@xk2800/nextjs-template/components/site/cookie-banner";
```

Gate your own analytics or marketing scripts the same way:

```tsx
import { useCookieConsent, hasOptionalConsent } from "@xk2800/nextjs-template/lib/cookie-consent";

const consent = useCookieConsent(); // "all" | "necessary" | null (not chosen yet / on the server)
if (consent === "all") { /* load analytics */ }
```

Don't need a banner (no EU/UK users, nothing optional)? Set `NEXT_PUBLIC_COOKIE_BANNER=false`. The banner and the footer link disappear, and consent is treated as granted, so nothing gated on it breaks.

### 5. Import what you need

```ts
// auth
import { auth } from "@xk2800/nextjs-template/auth";
import { requireAuth, hasRole } from "@xk2800/nextjs-template/auth/helpers";
import { authClient, useSession } from "@xk2800/nextjs-template/auth-client";

// db
import { db } from "@xk2800/nextjs-template/db";
import { users, sessions } from "@xk2800/nextjs-template/db/schema";

// server-only query helpers (each throws if imported into a Client Component)
import { getAdminStats } from "@xk2800/nextjs-template/admin/queries";
import { getUserSessions } from "@xk2800/nextjs-template/sessions/queries";
import { logActivity } from "@xk2800/nextjs-template/activity/logger";
import { getUserActivityLogs, getAllActivityLogs } from "@xk2800/nextjs-template/activity/queries";

// config, types, isomorphic helpers
import { config } from "@xk2800/nextjs-template/config/env";
import { LoginSchema } from "@xk2800/nextjs-template/types/auth/loginSchema";
import { SignupSchema } from "@xk2800/nextjs-template/types/auth/signupSchema";
import { formatDate, formatDateTime, getUserInitials } from "@xk2800/nextjs-template/lib/formatters";

// ui primitives (raw source, any file under components/ui)
import { Button } from "@xk2800/nextjs-template/components/ui/button";

// auth UI
import AuthCard from "@xk2800/nextjs-template/components/auth/authCard";
import LogoutButtons from "@xk2800/nextjs-template/components/auth/logoutButtons";
import EmailPasswordLogin from "@xk2800/nextjs-template/components/auth/emailPasswordLogin";
import EmailPasswordSignup from "@xk2800/nextjs-template/components/auth/emailPasswordSignup";
import OneTap from "@xk2800/nextjs-template/components/auth/oneTap"; // no-ops unless NEXT_PUBLIC_AUTH_ENABLE_ONE_TAP=true

// dashboard UI (each takes data as props — fetch with the helpers above in your page, then pass down)
import ProfileCard from "@xk2800/nextjs-template/components/dashboard/profileCard";
import AccountDetailsCard from "@xk2800/nextjs-template/components/dashboard/accountDetailsCard";
import SessionsCard from "@xk2800/nextjs-template/components/dashboard/sessionsCard";
import AdminSection, { type AdminStats } from "@xk2800/nextjs-template/components/dashboard/adminSection";
import ActivityLogsCard from "@xk2800/nextjs-template/components/dashboard/activityLogsCard";
import DashboardHeader, { type DashboardNavLink } from "@xk2800/nextjs-template/components/dashboard/dashboardHeader"; // brandName, brandHref, navLinks are optional props

// optional feature UI (needs the matching optional peer dep)
import { ThemeProvider } from "@xk2800/nextjs-template/components/providers/theme-provider"; // next-themes
import { ThemeToggle } from "@xk2800/nextjs-template/components/theme/theme-toggle"; // next-themes
import { SendEmailButton } from "@xk2800/nextjs-template/components/email/send-email-button";
import { EmailTemplate } from "@xk2800/nextjs-template/components/email/email-template"; // @react-email/components
```

### 6. Not importable — copy these patterns instead

`app/api/auth/[...all]/route.ts` and `middleware.ts` are Next.js file-convention code, not library exports. Copy the pattern into your own project:

```ts
// app/api/auth/[...all]/route.ts
import { auth } from "@xk2800/nextjs-template/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

### 7. Database migrations

The package does not ship migrations. drizzle-kit needs a local file it can import directly (it can't resolve package `exports` subpaths reliably), so add a one-line re-export in your own project:

```ts
// server/db/schema.ts
export * from "@xk2800/nextjs-template/db/schema";
```

Then point `drizzle.config.ts` at it, reading `DATABASE_URL` from `process.env` directly rather than importing `@xk2800/nextjs-template/config/env` — that module is guarded with `server-only`, which throws when resolved outside Next.js's own bundler (drizzle-kit runs via plain Node/esbuild, so the guard fires unconditionally there):

```ts
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./server/drizzle",
  schema: "./server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

### 8. Secrets management with Doppler (optional)

The package's `config/env.ts` and every server-only module just read `process.env.*` — they don't care whether values came from `.env` files or were injected by Doppler, so using Doppler in a consuming project needs zero changes to `@xk2800/nextjs-template` itself. Set it up the same way as in the template repo:

```bash
doppler login
doppler setup   # in your project root, select/create a Doppler project + config
```

Then wrap any command that needs your env vars with `doppler run --`, instead of relying on `.env.development`/`.env.local`:

```bash
doppler run -- bun dev
doppler run -- bun run generate   # drizzle-kit generate
doppler run -- bun run migrate    # drizzle-kit migrate
doppler run -- next build
```

Since `doppler run` injects secrets into `process.env` before the command starts, and both Next.js and Bun treat already-set `process.env` values as higher priority than `.env` file values, you can even keep `.env.development` around as a local fallback without conflict — Doppler's values win when present.
