# Port to nextjs-template: "new version available" banner + pull-to-refresh

Built and working in this app (jomkitaplan). Not yet in `@xk2800/nextjs-template`. Port it there.

## Why

An installed home-screen app (iOS Safari PWA) can stay open for days, so users keep running old JavaScript after a
deploy, and iOS gives standalone apps no browser refresh or pull-to-refresh. This adds:

1. A version check: the client compares the build id it was built with to the server's current one and shows a
   banner with an **Update** button (`location.reload()`). It never reloads by itself, so nobody loses a half-filled form.
2. Pull-to-refresh and a header refresh button for the installed app. Both do `router.refresh()` and also trigger the
   version check.

## Files (copy from this repo)

| File | What |
|---|---|
| `next.config.ts` | `const buildId = process.env.GIT_SHA ?? Date.now().toString(36)` and `env: { NEXT_PUBLIC_BUILD_ID: buildId }` |
| `app/api/version/route.ts` | `GET` returns `{ id: process.env.NEXT_PUBLIC_BUILD_ID }`, `dynamic = 'force-dynamic'`, `Cache-Control: no-store` |
| `components/dashboard/updateBanner.tsx` | Fetches `/api/version` on mount, on `visibilitychange` (visible), every 10 min while visible, and on a `check-update` window event. Fixed bottom card with an **Update** button when ids differ |
| `components/dashboard/pullToRefresh.tsx` | `PullToRefresh` (touch handlers, only when `display-mode: standalone`) and `RefreshButton` (header icon, hidden outside standalone via `[@media(display-mode:standalone)]:inline-flex`). Both dispatch `check-update` |
| `app/dashboard/layout.tsx` | Render `<PullToRefresh />` and `<UpdateBanner />` inside `SidebarInset`, and `<RefreshButton />` in the header |

## Behaviour details worth keeping

- Pull-to-refresh ignores the touch when `window.scrollY > 0`, when a `[role="dialog"]` is open, or when the touch starts
  inside a scroller that is scrolled down (`insideScroller`). Threshold 70px of damped (x0.5) pull.
- The banner only shows for people who already run a build that contains the check. Older copies need one manual reload.
- Without `GIT_SHA` every build gets a new timestamp id. Set `GIT_SHA` to the commit hash in CI for a stable id (rebuilding
  the same commit then does not trigger the banner).
- In `bun dev` the id changes only when the server restarts.
- `/api/version` returns 503 during maintenance mode (proxy.ts). The banner ignores fetch errors, which is fine.

## Template constraints (see CLAUDE.md "Package constraints")

- Shipped components must use **relative imports, not `@/`**. This repo's copies use `@/components/ui/button`, so change
  that import when moving them into the package.
- New `components/dashboard/*.tsx` files ship via the `components/*` directories in `files`. If the dashboard directory is
  already listed, no `exports` change is needed. `create-nextjs` re-exports them as one-liners.
- `next.config.ts` and `app/api/version/route.ts` are **not** package code. They live in the cloned repo, so add them to the
  template repo itself. Apps already scaffolded need the two edits by hand (document it in the changelog).
- No new dependencies: uses `lucide-react`, `next/navigation` and the existing `Button`.
- Per CLAUDE.md workflow step 3, when porting also update `docs/content/`, `app/features/page.tsx`, `SPEC.md` §5,
  `data/changelog.json` and `features-test.md`.
