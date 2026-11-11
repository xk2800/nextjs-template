# Site Components Reorganization Plan

## 1. Context & Structural Bottlenecks

Currently, your `components/site` folder contains a mix of 7 flat components serving different responsibilities across the application:

### Identified Issues:

1. **Mixing Layout, Infrastructure & Compliance:** Public marketing layout elements (`site-header.tsx`, `site-footer.tsx`) sit in the same folder as real-time web push synchronization components (`push-sync.tsx`) and privacy overlays (`cookie-banner.tsx`).

2. **Repetitive Prefix Redundancy:** Files like `site-header.tsx` and `site-footer.tsx` repeat the `site-` prefix inside a folder that is already named `site`.

3. **Ambiguous Scope:** It is unclear whether `site/` is strictly for the public-facing marketing pages or global app infrastructure (like push notifications and GDPR compliance).

## 2. Proposed Directory Architecture

Organize the `site/` directory by functional area into **Layout**, **Compliance**, **Notifications**, and **Display UI**:

```
components/site/
├── layout/                           # Public marketing site navigation & shells
│   ├── header.tsx                    # (was site-header.tsx)
│   ├── footer.tsx                    # (was site-footer.tsx)
│   └── logo.tsx                      # (was logo.tsx - brand logo)
│
├── compliance/                       # GDPR & Privacy overlays
│   └── cookie-banner.tsx             # Cookie consent banner
│
├── push/                             # Web Push notifications (or move to components/notifications)
│   ├── push-notifications-card.tsx
│   └── push-sync.tsx                 # Background push sync listener
│
└── ui/                               # Landing page preview components & mockups
    └── window-chrome.tsx             # Browser window frame preview mockup

```

> **Architecture Tip:** If `push-sync.tsx` and `push-notifications-card.tsx` are used inside the `/dashboard` as well as the public site, consider moving them to a top-level `components/notifications/` or `components/push/` directory so they are clearly marked as app-wide features.

## 3. Migration Mapping Table

| Current Path | Proposed Path | Scope / Target Route |
| ----- | ----- | ----- |
| `site/site-header.tsx` | `site/layout/header.tsx` | Public Landing / Marketing Pages |
| `site/site-footer.tsx` | `site/layout/footer.tsx` | Public Landing / Marketing Pages |
| `site/logo.tsx` | `site/layout/logo.tsx` | Global Brand Header |
| `site/cookie-banner.tsx` | `site/compliance/cookie-banner.tsx` | Global Layout Overlay |
| `site/push-sync.tsx` | `site/push/push-sync.tsx` (or `components/push/`) | Root App Provider / Layout |
| `site/push-notifications-card.tsx` | `site/push/push-notifications-card.tsx` | Dashboard / Site Settings |
| `site/window-chrome.tsx` | `site/ui/window-chrome.tsx` | Marketing Showcase / Hero Section |

## 4. Barrel Export Pattern (`index.ts`)

Adding barrel exports allows clean multi-component imports across your landing page routes:

```typescript
// components/site/layout/index.ts
export * from "./header";
export * from "./footer";
export * from "./logo";
```

### Clean Import Example (`app/(marketing)/layout.tsx`):

```tsx
import { Header, Footer } from "@/components/site/layout";
import { CookieBanner } from "@/components/site/compliance/cookie-banner";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CookieBanner />
    </div>
  );
}
```

## 5. Implementation Checklist

* [ ] Create sub-directories: `mkdir -p components/site/{layout,compliance,push,ui}`.
* [ ] Move and rename files according to the mapping table.
* [ ] Strip repetitive `site-` prefixes from `header.tsx` and `footer.tsx`.
* [ ] Update marketing layout imports in `app/(marketing)/layout.tsx` or `app/page.tsx`.
* [ ] Verify that `push-sync.tsx` remains mounted at the app root level for handling push subscriptions.