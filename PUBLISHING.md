# Publishing & Consuming `@xk2800/nextjs-template` as a Private npm Package

This repo doubles as a **private npm library** published to **GitHub Packages** (GitHub's npm registry). Because the GitHub repo is private, the package is private too — only accounts with a valid GitHub token that can read the repo can install it. That covers "just me and my server" with no paid npm account and no self-hosted registry.

---

## 1. How the library is wired (what was already set up + what changed)

### Already in place

| Piece | Where | What it does |
|---|---|---|
| Package identity | `package.json` → `"name": "@xk2800/nextjs-template"` | The `@xk2800` scope must match the GitHub username — GitHub Packages requires this. |
| Registry routing | `.npmrc` | Routes the `@xk2800` scope to `npm.pkg.github.com` and reads the auth token from the `GITHUB_TOKEN` env var. Safe to commit — no secret in the file. |
| Server/lib build | `tsup.config.ts` + `bun run build:lib` | Compiles 11 server-side entry points (`server/auth.ts`, `server/db/*`, `lib/*-queries.ts`, etc.) to `dist/` as CJS + ESM with `.d.ts` types. |
| Component shipping | `package.json` → `"exports": { "./components/*": "./components/*.tsx" }` | React components ship as **raw `.tsx` source**, not compiled JS. The consuming Next.js app transpiles them (see `transpilePackages` below). This keeps `"use client"` directives intact and lets Tailwind scan the real class names. |
| Publish whitelist | `package.json` → `"files"` | Only `dist/`, the component folders, 3 `lib/` files, `styles/theme.css`, and the README go into the tarball. The app itself (`app/`, `docs/`, configs, migrations) is never published. |
| Theme tokens | `styles/theme.css` | A standalone copy of the shadcn theme variables (`--background`, `--primary`, oklch colors, dark mode) for consumers to import. |
| Pre-publish safety | `"prepublishOnly"` script | Automatically runs typecheck + `tsup` build before every publish, so you can't publish a stale or broken `dist/`. |
| Peer dependencies | `package.json` → `"peerDependencies"` | React, Next, Radix, clsx, etc. are peers so the consumer's versions are used (no duplicate React). `next-themes`, `sonner`, `@react-email/components` are optional — only needed if you use the components that import them. |

### Changed to enable private publishing

1. **`"repository"` field added** — GitHub Packages uses it to link the published package to this repo, so the package inherits the repo's private visibility and shows in the repo sidebar.
2. **`"publishConfig": { "registry": "https://npm.pkg.github.com" }` added** — hard-pins the publish target so `npm publish` can never accidentally push to the public npmjs.com registry, regardless of local npm config.

Verified end-to-end: `bun run typecheck && bun run build:lib` passes; `npm pack` produces a 57.7 kB tarball with 111 files (all of `dist/`, 27 component files, `styles/theme.css`); and a scratch Next.js 16 consumer app installed that tarball, auto-resolved all peer deps via bun, compiled the raw `.tsx` components through `transpilePackages`, and `next build` succeeded with the packaged components' Tailwind utilities and theme variables present in the final CSS.

---

## 2. One-time setup: GitHub token (required before first publish)

You need a **classic Personal Access Token** (GitHub Packages does not support fine-grained tokens for npm):

1. Go to <https://github.com/settings/tokens> → *Generate new token (classic)*.
2. Scopes:
   - `write:packages` (includes `read:packages`) — for publishing from your machine
   - `repo` — required because the repo is private
3. Make it available to npm/bun by exporting it. Add to `~/.zshrc`:

   ```bash
   export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
   ```

   Then `source ~/.zshrc`.

4. Verify auth works:

   ```bash
   npm whoami --registry=https://npm.pkg.github.com
   # should print: xk2800
   ```

> **Tip:** create a **second, read-only token** (`read:packages` + `repo` only) for the VPS. If the server is ever compromised, the leaked token can't publish or push code.

---

## 3. Publishing a release (from this repo)

```bash
# 1. Bump the version (creates a git commit + tag automatically)
npm version patch        # 0.1.9 -> 0.1.10  (or: minor / major)

# 2. Publish — prepublishOnly runs typecheck + build:lib for you
npm publish

# 3. Push the version commit and tag
git push && git push --tags
```

After the first publish, the package appears at
`https://github.com/xk2800/nextjs-template` → **Packages** (right sidebar), and at
`https://github.com/xk2800?tab=packages`.

**Every code change you want consumers to get requires a version bump + publish.** Consumers then run `bun update @xk2800/nextjs-template` (or pin the new version).

---

## 4. Using the library in a new project (local machine)

Assumes a Next.js 15/16 + Tailwind 4 app (e.g. `bunx create-next-app@latest`).

### Step 1 — `.npmrc` in the consumer project root (commit this file)

```
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
@xk2800:registry=https://npm.pkg.github.com
```

There is no secret here — the token comes from your environment. Since `GITHUB_TOKEN` is already exported in your shell (Step 2 above), installs just work.

### Step 2 — Install

```bash
bun add @xk2800/nextjs-template
```

Bun/npm auto-install the required peer dependencies (Radix, clsx, tailwind-merge, lucide-react, …). **Yarn classic (v1) does not** — if yarn ever runs an install in the project it will *remove* auto-installed peers; stick to one package manager per project (see Troubleshooting). Add the **optional** peers only if you use the components that need them:

```bash
bun add next-themes   # if using components/providers/theme-provider or components/theme/theme-toggle
bun add sonner        # if using components/dashboard/sessionsCard
bun add @react-email/components resend   # if using components/email/*
```

### Step 3 — `next.config.ts`: transpile the package

The components ship as raw `.tsx`, so Next must compile them from `node_modules`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@xk2800/nextjs-template"],
};

export default nextConfig;
```

### Step 4 — `app/globals.css`: theme tokens + Tailwind source scan

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

### Step 5 — Use it

```tsx
// UI components
import { Button } from "@xk2800/nextjs-template/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@xk2800/nextjs-template/components/ui/card";

// Auth UI + client
import { AuthCard } from "@xk2800/nextjs-template/components/auth/authCard";
import { authClient, useSession } from "@xk2800/nextjs-template/auth-client";

// Utilities
import { cn } from "@xk2800/nextjs-template/lib/utils";

// Server-side (compiled, typed — Server Components / route handlers only)
import { auth } from "@xk2800/nextjs-template/auth";
import { db } from "@xk2800/nextjs-template/db";
import * as schema from "@xk2800/nextjs-template/db/schema";
```

> Server modules (`/auth`, `/db`, …) read the same env vars as this template (`DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID/SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`) — set them in the consumer app's `.env` files if you use those imports. For components-only usage, no env vars are needed.

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

The consumer repo already commits `.npmrc`, so the server only needs `GITHUB_TOKEN` in its environment at **install time**. Use the read-only token from Section 2.

### Bare VPS (bun/npm install runs directly on the machine)

Add to the deploy user's `~/.profile` (or the systemd service / deploy script environment):

```bash
export GITHUB_TOKEN=ghp_readonly_xxxxxxxx
```

Then `bun install` in the consumer app works exactly as it does locally.

### Docker

Use a **BuildKit secret** so the token is available during `bun install` but never stored in an image layer:

```dockerfile
# syntax=docker/dockerfile:1
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock .npmrc ./
RUN --mount=type=secret,id=github_token \
    GITHUB_TOKEN=$(cat /run/secrets/github_token) bun install --frozen-lockfile
```

Build with:

```bash
docker build --secret id=github_token,env=GITHUB_TOKEN .
```

**Do not** use `ARG GITHUB_TOKEN` / `ENV GITHUB_TOKEN` — build args and envs are baked into image history and recoverable with `docker history`.

### Verifying the server can install

```bash
# on the VPS (or in a clean temp dir):
export GITHUB_TOKEN=ghp_readonly_xxxxxxxx
npm whoami --registry=https://npm.pkg.github.com   # → xk2800 means auth is good
cd /path/to/consumer-app && bun install            # should pull @xk2800/nextjs-template
```

---

## 6. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `401 Unauthorized` from `npm.pkg.github.com` | `GITHUB_TOKEN` not set in the environment running the install, or the token expired. `echo $GITHUB_TOKEN` to check. |
| `403 Permission denied` | Token is missing scopes — needs `read:packages` **and** `repo` (private repo). Publishing needs `write:packages`. Must be a **classic** PAT. |
| `404 Not Found` on install | Package not published yet, version doesn't exist, or the token's account can't see the repo. |
| Components render completely unstyled | Missing `@source "../node_modules/@xk2800/nextjs-template";` in globals.css (Tailwind 4 skips node_modules), or `theme.css` not imported. |
| `Module parse failed` / JSX syntax error from the package | Missing `transpilePackages: ["@xk2800/nextjs-template"]` in the consumer's next.config. |
| Consumer gets old code after you pushed changes | You must `npm version patch && npm publish` here, then `bun update @xk2800/nextjs-template` in the consumer. Installs pull from the registry, not from git. |
| Publish rejected: "version already exists" | GitHub Packages versions are immutable. Bump with `npm version patch` and publish again. |
| `next build` crashes with `The "id" argument must be of type string` and appears to run a package install mid-build | Next 16's TypeScript auto-setup can't resolve **TypeScript 7** (the native Go rewrite) and loops trying to reinstall it every build. Pin `typescript@^5` in the consumer app (`bun add -d typescript@^5.9.0`), delete `node_modules` + any stray `yarn.lock`, and reinstall. (Hit and confirmed during verification.) |
| Peer deps vanish after a build that printed yarn output (`Done in Xs`, "unmet peer dependency" warnings) | Next's auto-installer shelled out to globally-installed yarn v1, which prunes peers bun had auto-installed. Fix the root cause above, remove `yarn.lock`/`.yarn-integrity`, and reinstall with bun. |
| Theme colors look right but you can't find `oklch(...)` in the built CSS | Not a bug — Tailwind 4's Lightning CSS transpiles `oklch()` to hex/`lab()` fallbacks. Check for `.dark` rules and `--background:` definitions instead. |
