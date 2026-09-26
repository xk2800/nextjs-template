# Publishing & Consuming `@xk2800/nextjs-template` as a Public npm Package

This repo doubles as a **public npm library** published to the **public npm registry** (`registry.npmjs.org`). Anyone can install it with `bun add @xk2800/nextjs-template` — no token, no `.npmrc`, no GitHub repo access required.

---

## 1. How the library is wired (what was already set up)

| Piece               | Where                                                                    | What it does                                                                                                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package identity    | `package.json` → `"name": "@xk2800/nextjs-template"`                     | Scoped package name; scope doesn't need to match anything on npmjs (unlike GitHub Packages, which requires the scope to match the GitHub username).                                                                               |
| Registry routing    | `package.json` → `"publishConfig"`                                       | Pins `registry` to `https://registry.npmjs.org` and `access` to `"public"` — scoped packages default to private on npmjs, which fails on a free account without this flag.                                                        |
| Server/lib build    | `tsup.config.ts` + `bun run build:lib`                                   | Compiles 11 server-side entry points (`server/auth.ts`, `server/db/*`, `lib/*-queries.ts`, etc.) to `dist/` as CJS + ESM with `.d.ts` types.                                                                                       |
| Component shipping  | `package.json` → `"exports": { "./components/*": "./components/*.tsx" }` | React components ship as **raw `.tsx` source**, not compiled JS. The consuming Next.js app transpiles them (see `transpilePackages` below). This keeps `"use client"` directives intact and lets Tailwind scan the real class names. |
| Publish whitelist   | `package.json` → `"files"`                                               | Only `dist/`, the component folders, 3 `lib/` files, `styles/theme.css`, and the README go into the tarball. The app itself (`app/`, `docs/`, configs, migrations) is never published.                                             |
| Theme tokens        | `styles/theme.css`                                                       | A standalone copy of the shadcn theme variables (`--background`, `--primary`, oklch colors, dark mode) for consumers to import.                                                                                                    |
| Pre-publish safety  | `"prepublishOnly"` script                                                | Automatically runs typecheck + `tsup` build before every publish, so you can't publish a stale or broken `dist/`.                                                                                                                  |
| Peer dependencies   | `package.json` → `"peerDependencies"`                                    | React, Next, Radix, clsx, etc. are peers so the consumer's versions are used (no duplicate React). `next-themes`, `sonner`, `@react-email/components` are optional — only needed if you use the components that import them.       |

---

## 2. One-time setup: npm token (required before first publish)

You need an **npm account** (free) with the `@xk2800` scope available (scopes are first-come; claim it once via any publish or `npm org` if you plan to use it across multiple packages).

1. Create an [Automation token](https://docs.npmjs.com/creating-and-viewing-access-tokens) at <https://www.npmjs.com/settings/~/tokens> (type: **Automation**, works in CI without 2FA prompts; use **Publish** type for local interactive use).
2. Make it available to npm/bun by exporting it. Add to `~/.zshrc`:

   ```bash
   export NPM_TOKEN=npm_xxxxxxxxxxxxxxxxxxxx
   ```

   Then `source ~/.zshrc`.

3. Verify auth works:

   ```bash
   npm whoami --registry=https://registry.npmjs.org
   # should print your npm username
   ```

The repo's root `.npmrc` (gitignored, local only) already points at `registry.npmjs.org` and reads `${NPM_TOKEN}`:

```
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

---

## 3. Publishing a release (from this repo)

### Option A — interactive (`bun run bump-version`)

```bash
bun run bump-version
```

An Inquirer.js prompt to pick **patch / minor / major (stable)**, each showing the resulting version number. It then optionally runs `typecheck` + `build:lib`, runs `npm version <type>`, and can `npm publish`, push the commit + tag, and publish a **GitHub Release** for you — confirming before each step. Source: `scripts/bump-version.ts`.

The first prompt is the **release type**: `feature`, `improvement`, `fix`, or **`beta`**. Pick `beta` to test changes before they reach live versions:

- Version becomes a prerelease — `0.5.3` + patch → `0.5.4-beta.0`. While already on a beta, **Next beta** gives `0.5.4-beta.1`, and so on.
- Published with `npm publish --tag beta`, so `latest` (what `bun add` / `bun update` install) is untouched. Test it with `bun add @xk2800/nextjs-template@beta`.
- The GitHub Release is marked `--prerelease`, and the changelog entry gets a `beta` badge.
- To ship it live, run again with a non-beta type — `0.5.4-beta.1` + patch → `0.5.4`, published as `latest`.

Manual equivalent: `npm version prepatch --preid beta` (or `prerelease --preid beta` for the next beta), then `npm publish --tag beta`.

### Option B — manual

```bash
# 1. Bump the version (creates a git commit + tag automatically)
npm version patch        # 0.1.9 -> 0.1.10  (or: minor / major)

# 2. Publish — prepublishOnly runs typecheck + build:lib for you
npm publish

# 3. Push the version commit and tag
git push && git push --tags
```

After the first publish, the package appears at
`https://www.npmjs.com/package/@xk2800/nextjs-template`.

**Every code change you want consumers to get requires a version bump + publish.** Consumers then run `bun update @xk2800/nextjs-template` (or pin the new version).

---

## 4. Using the library in a new project (local machine)

Assumes a Next.js 15/16 + Tailwind 4 app (e.g. `bunx create-next-app@latest`).

### Step 1 — Install

```bash
bun add @xk2800/nextjs-template
```

No `.npmrc`, no token, no GitHub account needed — it's a normal public npm install. Bun/npm auto-install the required peer dependencies (Radix, clsx, tailwind-merge, lucide-react, …). **Yarn classic (v1) does not** — if yarn ever runs an install in the project it will _remove_ auto-installed peers; stick to one package manager per project (see Troubleshooting). Add the **optional** peers only if you use the components that need them:

```bash
bun add next-themes   # if using components/providers/theme-provider or components/theme/theme-toggle
bun add sonner        # if using components/dashboard/sessionsCard
bun add @react-email/components resend   # if using components/email/*
```

### Step 2 — `next.config.ts`: transpile the package

The components ship as raw `.tsx`, so Next must compile them from `node_modules`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@xk2800/nextjs-template"],
};

export default nextConfig;
```

### Step 3 — `app/globals.css`: theme tokens + Tailwind source scan

```css
@import "tailwindcss";
@import "tw-animate-css"; /* bun add -d tw-animate-css — used by shadcn animations */
@import "@xk2800/nextjs-template/styles/theme.css";

/* CRITICAL: Tailwind 4 does not scan node_modules by default.
   Without this line, the utility classes used inside the packaged
   components are never generated and everything renders unstyled. */
@source "../node_modules/@xk2800/nextjs-template";
```

(Adjust the relative path if your globals.css isn't in `app/` — it must resolve from the CSS file to `node_modules`.)

### Step 4 — Use it

```tsx
// UI components
import { Button } from "@xk2800/nextjs-template/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@xk2800/nextjs-template/components/ui/card";

// Auth UI + client
import AuthCard from "@xk2800/nextjs-template/components/auth/authCard";
import { authClient, useSession } from "@xk2800/nextjs-template/auth-client";

// Schema validation
import { SignupSchema } from "@xk2800/nextjs-template/types/auth/signupSchema";

// Utilities
import { cn } from "@xk2800/nextjs-template/lib/utils";

// Server-side (compiled, typed — Server Components / route handlers only)
import { auth } from "@xk2800/nextjs-template/auth";
import { db } from "@xk2800/nextjs-template/db";
import * as schema from "@xk2800/nextjs-template/db/schema";

const result = SignupSchema.safeParse({
  name: "Example User",
  email: "user@example.com",
  password: "Passw0rd!",
});

if (!result.success) {
  console.error(result.error.issues);
} else {
  console.log("valid signup payload");
}
```

> Server modules (`/auth`, `/db`, …) read the same env vars as this template (`DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID/SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`) — set them in the consumer app's `.env` files if you use those imports. For components-only usage, no env vars are needed — except `components/auth/oneTap`, which reads `NEXT_PUBLIC_AUTH_ENABLE_ONE_TAP` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` directly (see README's "Enabling Google One Tap") since it has no server counterpart to source config from.

### Testing a change locally without publishing

From this repo, after `bun run build:lib`:

```bash
npm pack                                  # creates xk2800-nextjs-template-0.1.x.tgz
cd ../my-other-app
bun add ../nextjs-template/xk2800-nextjs-template-0.1.x.tgz
```

This installs the exact tarball a publish would produce — the most faithful pre-publish test. (Prefer this over `bun link` for verification, since `link` bypasses the `files` whitelist and can hide packaging mistakes.)

---

## 5. Installing on the VPS / Docker

Public npmjs installs need **no auth at all** — no token, no secret, no `.npmrc`. `bun install` / `npm install` just works, on the VPS or in a Docker build, exactly like installing `react` or `zod`.

---

## 6. Troubleshooting

| Symptom                                                                                                             | Cause / fix                                                                                                                                                                                                                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `402 Payment Required` or `You must sign up for private packages` on `npm publish`                                    | Missing `"publishConfig": { "access": "public" }` in `package.json` — scoped packages (`@scope/name`) default to private on npmjs, which requires a paid account. Already set in this repo; check it wasn't reverted.                                                                                                |
| `401 Unauthorized` on `npm publish`                                                                                    | `NPM_TOKEN` is not set in the environment, or the token expired/was revoked. Check whether the variable exists without printing its value (`[[ -n "${NPM_TOKEN:-}" ]] && echo set \|\| echo unset`).                                                                                                                    |
| `403 Forbidden` on `npm publish`                                                                                       | You don't own the `@xk2800` scope on npmjs, or the token lacks publish permission (must be Automation or Publish type, not Read-only).                                                                                                                                                                                 |
| `404 Not Found` on install                                                                                             | Package not published yet, or the version doesn't exist. Check <https://www.npmjs.com/package/@xk2800/nextjs-template>.                                                                                                                                                                                                |
| Components render completely unstyled                                                                                 | Missing `@source "../node_modules/@xk2800/nextjs-template";` in globals.css (Tailwind 4 skips node_modules), or `theme.css` not imported.                                                                                                                                                                               |
| `Module parse failed` / JSX syntax error from the package                                                              | Missing `transpilePackages: ["@xk2800/nextjs-template"]` in the consumer's next.config.                                                                                                                                                                                                                                 |
| Consumer gets old code after you pushed changes                                                                        | You must `npm version patch && npm publish` here, then `bun update @xk2800/nextjs-template` in the consumer. Installs pull from the registry, not from git.                                                                                                                                                            |
| New version tagged and pushed, but the repo sidebar's "Releases" still shows the old version as latest                 | A pushed git tag is not a GitHub Release — they're separate objects. `npm version` + `git push --tags` only creates/pushes the tag. Publish the Release explicitly: GitHub UI → "Draft a new release", `gh release create <tag>`, or `bun run bump-version` (Option A above), which does this for you.                   |
| Publish rejected: "version already exists"                                                                             | npm registry versions are immutable. Bump with `npm version patch` and publish again.                                                                                                                                                                                                                                  |
| `next build` crashes with `The "id" argument must be of type string` and appears to run a package install mid-build   | Next 16's TypeScript auto-setup can't resolve **TypeScript 7** (the native Go rewrite) and loops trying to reinstall it every build. Pin `typescript@^5` in the consumer app (`bun add -d typescript@^5.9.0`), delete `node_modules` + any stray `yarn.lock`, and reinstall. (Hit and confirmed during verification.)  |
| Peer deps vanish after a build that printed yarn output (`Done in Xs`, "unmet peer dependency" warnings)               | Next's auto-installer shelled out to globally-installed yarn v1, which prunes peers bun had auto-installed. Fix the root cause above, remove `yarn.lock`/`.yarn-integrity`, and reinstall with bun.                                                                                                                    |
| Theme colors look right but you can't find `oklch(...)` in the built CSS                                               | Not a bug — Tailwind 4's Lightning CSS transpiles `oklch()` to hex/`lab()` fallbacks. Check for `.dark` rules and `--background:` definitions instead.                                                                                                                                                                  |
