# Overview Folder Structure & Scaling Plan

## 1. Current Assessment

Your `overview/` directory currently contains 4 files:

* `overview-chart.tsx`
* `overview-stats.tsx`
* `recent-activity.tsx`
* `welcome-banner.tsx`

**Verdict:** Unlike larger folders with 20+ flat files, this 4-file folder is already **lean, well-scoped, and cleanly named** using `kebab-case`. Because these components directly map to the main `/dashboard` page sections, keeping them grouped in this folder is the correct architectural pattern.

However, as you introduce **loading skeletons** (for React Suspense streaming), **types**, and **chart child components**, keeping the directory structured will prevent future clutter.

---

## 2. Recommended Directory Architecture

Here is the ideal structure for `components/dashboard/overview/` now and as it scales:

```
components/dashboard/overview/
├── index.ts                     # Barrel export for single-line imports
├── welcome-banner.tsx           # Onboarding / Quick-start alert
├── overview-stats.tsx           # 4-Up KPI Grid
├── overview-chart.tsx           # Primary analytics / chart container
├── recent-activity.tsx          # Activity feed & CTA panel
│
├── skeletons/                   # Loading placeholders for React Suspense
│   ├── overview-stats-skeleton.tsx
│   ├── overview-chart-skeleton.tsx
│   └── recent-activity-skeleton.tsx
│
└── types.ts                     # (Optional) Overview prop & data interfaces
```

---

## 3. Clean Barrel Export (`index.ts`)

Adding an `index.ts` file inside `overview/` allows you to export all overview components cleanly.

```typescript
// components/dashboard/overview/index.ts
export * from "./welcome-banner";
export * from "./overview-stats";
export * from "./overview-chart";
export * from "./recent-activity";
```

### Usage in `app/dashboard/page.tsx`:

**Before (Multiple Import Lines):**

```tsx
import { WelcomeBanner } from "@/components/dashboard/overview/welcome-banner";
import { OverviewStats } from "@/components/dashboard/overview/overview-stats";
import { OverviewChart } from "@/components/dashboard/overview/overview-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
```

**After (Clean Single-Line Import):**

```tsx
import {
  WelcomeBanner,
  OverviewStats,
  OverviewChart,
  RecentActivity,
} from "@/components/dashboard/overview";
```

---

## 4. Scaling Rules for `overview/`

1. **Keep Page-Specific Components Here:** If a component is *only* rendered on `/dashboard` (e.g. `welcome-banner.tsx`), keep it inside `overview/`.
2. **Promote Reusable Components:** If `recent-activity.tsx` is needed on other pages (like `/dashboard/admin`), move it to `components/dashboard/common/`.
3. **Isolate Loading States:** Store skeleton fallback components in a `skeletons/` subfolder so they don't crowd the main component list when implementing Server Component streaming with `<Suspense fallback={<StatsSkeleton />}>`.

---

## 5. Implementation Checklist

* [ ] Add `index.ts` to `components/dashboard/overview/` for barrel exports.
* [ ] Create `skeletons/` sub-folder when adding Suspense fallbacks.
* [ ] Update `app/dashboard/page.tsx` to use clean barrel imports.