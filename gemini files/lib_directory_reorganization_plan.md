# `lib/` Directory Reorganization Plan

## 1. Context & Bottlenecks

Currently, your `lib/` folder has **40+ flat files** mixing database queries, auth helpers, security utilities, email handlers, and unit tests directly at the root level. 

As a codebase grows, a flat `lib/` directory introduces several problems:
* **Friction finding files:** Searching for queries vs. utilities requires reading prefixes (`auth-`, `activity-`, `marketing-`).
* **Unclear module boundaries:** Hard to tell which files belong to server operations vs. client utilities.
* **Test clutter:** Unit tests (`*.test.ts`) sitting directly alongside production logic make the root folder noisy.

---

## 2. Proposed Directory Tree Structure

Organize `lib/` into **domain-focused subdirectories**, grouping related logic and co-locating unit tests inside domain folders.

```
lib/
├── auth/                      # Authentication & session helpers (Better-Auth)
│   ├── client.ts              # (was auth-client.ts)
│   ├── helpers.ts             # (was auth-helpers.ts)
│   ├── throttle.ts            # (was auth-throttle.ts)
│   ├── throttle-limits.ts     # (was auth-throttle-limits.ts)
│   ├── two-factor.ts          # (was two-factor.ts)
│   └── __tests__/             # Co-located auth unit tests
│       ├── auth-throttle-limits.test.ts
│       └── two-factor.test.ts
│
├── db/                        # Database queries & data access layer (DAL)
│   └── queries/
│       ├── activity.ts        # (was activity-queries.ts)
│       ├── admin.ts           # (was admin-queries.ts)
│       ├── impersonation.ts   # (was impersonation-queries.ts)
│       ├── session.ts         # (was session-queries.ts)
│       ├── settings.ts        # (was settings-queries.ts)
│       └── user.ts            # (was user-queries.ts)
│
├── security/                  # Audit logging, device fingerprints & consent
│   ├── activity-logger.ts
│   ├── activity-severity.ts
│   ├── cookie-consent.ts
│   ├── cookie-names.ts
│   ├── device-fingerprint.ts
│   ├── shared-devices.ts
│   └── __tests__/
│       ├── cookie-names.test.ts
│       └── shared-devices.test.ts
│
├── email/                     # Transactional & marketing email handlers
│   ├── resend.ts              # Resend client instance
│   ├── ban-email.ts
│   ├── marketing-email.ts
│   └── __tests__/
│       └── marketing-email.test.ts
│
├── marketing/                 # Marketing API routes & subscription logic
│   ├── client.ts
│   ├── marketing.ts
│   └── route.ts               # (was marketing-route.ts)
│
├── push/                      # Push notification engine
│   ├── client.ts              # (was push-client.ts)
│   └── push.ts
│
├── config/                    # System & application configuration
│   ├── site.ts                # App metadata & navigation constants
│   └── maintenance.ts         # Maintenance mode checks
│
├── mock/                      # Mock datasets for local development
│   └── dashboard-data.ts      # (was mock-dashboard-data.ts)
│
└── utils/                     # Generic, reusable helper functions
    ├── csv.ts
    ├── errors.ts
    ├── formatters.ts
    ├── page-range.ts
    ├── recalculate-columns.ts
    ├── request-info.ts
    ├── utils.ts               # standard `cn()` / Tailwind merge helpers
    └── __tests__/
        ├── file-upload-accept.test.ts
        ├── install-target.test.ts
        ├── page-range.test.ts
        └── recalculate-columns.test.ts
```

---

## 3. Migration Mapping Table

Use this mapping table when performing automated IDE refactoring or updating import paths across your app:

| Current Path | Proposed Path | Domain Category |
| :--- | :--- | :--- |
| `lib/auth-client.ts` | `lib/auth/client.ts` | Auth |
| `lib/auth-helpers.ts` | `lib/auth/helpers.ts` | Auth |
| `lib/auth-throttle.ts` | `lib/auth/throttle.ts` | Auth |
| `lib/auth-throttle-limits.ts` | `lib/auth/throttle-limits.ts` | Auth |
| `lib/two-factor.ts` | `lib/auth/two-factor.ts` | Auth |
| `lib/*-queries.ts` | `lib/db/queries/*.ts` | Database Queries |
| `lib/activity-logger.ts` | `lib/security/activity-logger.ts` | Security & Logs |
| `lib/device-fingerprint.ts` | `lib/security/device-fingerprint.ts` | Security & Logs |
| `lib/cookie-consent.ts` | `lib/security/cookie-consent.ts` | Security & Consent |
| `lib/resend.ts` | `lib/email/resend.ts` | Email |
| `lib/ban-email.ts` | `lib/email/ban-email.ts` | Email |
| `lib/marketing-email.ts` | `lib/email/marketing-email.ts` | Email |
| `lib/push-client.ts` | `lib/push/client.ts` | Push Notifications |
| `lib/site.ts` | `lib/config/site.ts` | App Config |
| `lib/maintenance.ts` | `lib/config/maintenance.ts` | App Config |
| `lib/mock-dashboard-data.ts` | `lib/mock/dashboard-data.ts` | Dev Mock Data |
| `lib/*.test.ts` | `lib/[domain]/__tests__/*.test.ts` | Testing |

---

## 4. Import Path Optimization (`tsconfig.json`)

To keep imports clean after reorganizing, ensure your `tsconfig.json` supports sub-folder path aliases:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@/auth/*": ["./lib/auth/*"],
      "@/queries/*": ["./lib/db/queries/*"],
      "@/security/*": ["./lib/security/*"],
      "@/utils/*": ["./lib/utils/*"]
    }
  }
}
```

### Example Before & After Imports:

**Before (Cluttered Root Import):**
```typescript
import { getUserById } from "@/lib/user-queries";
import { sendBanEmail } from "@/lib/ban-email";
import { formatCurrency } from "@/lib/formatters";
```

**After (Clean Domain Imports):**
```typescript
import { getUserById } from "@/queries/user";
import { sendBanEmail } from "@/lib/email/ban-email";
import { formatCurrency } from "@/lib/utils/formatters";
```

---

## 5. Implementation Steps

1. **Create Subfolders:** Run `mkdir -p lib/{auth,db/queries,security,email,marketing,push,config,mock,utils}`.
2. **Move Unit Tests:** Group unit tests inside matching `__tests__/` directories under each domain.
3. **Update Queries:** Consolidate all `*-queries.ts` into `lib/db/queries/`.
4. **IDE Rename/Refactor:** Use VS Code / WebStorm F2 file move actions so TypeScript automatically updates relative import statements throughout the project.
5. **Run Test Suite:** Run `npm test` or `vitest` to verify no module imports broke during the move.