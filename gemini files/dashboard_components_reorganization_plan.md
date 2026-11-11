# Dashboard Components Reorganization Plan

## 1. Context & Structural Bottlenecks

Currently, your `components/dashboard` folder contains over 60 flat component files split across a root directory and a massive `admin/` subfolder.

### Identified Friction Points:
1. **Layout vs. Page Component Mixing:** Shell components (`appSidebar.tsx`, `topNav.tsx`, `dashboardHeader.tsx`) sit right alongside sub-page cards (`passkeysCard.tsx`, `twoFactorCard.tsx`).
2. **Massive Flat `admin/` Dumping Ground:** 40+ admin components for completely different sub-pages (Users, Activity Logs, System Settings, Marketing) are dumped into a single `admin/` folder.
3. **Inconsistent Naming & Skeletons:** File names use `camelCase` (`activityLogsSection.tsx`) mixed with component logic, and skeleton placeholders (`adminActivityLogsSkeleton.tsx`) sit loosely beside primary UI cards.

---

## 2. Proposed Directory Architecture

Organize components by **Route Domain** (matching your `/dashboard` URL paths) and separate global layout shells into a dedicated folder.

```
components/dashboard/
├── layout/                           # Global dashboard shell & navigation
│   ├── app-sidebar.tsx               # (was appSidebar.tsx)
│   ├── dashboard-header.tsx          # (was dashboardHeader.tsx)
│   ├── top-nav.tsx                   # (was topNav.tsx)
│   ├── nav-style-toggle.tsx          # (was navStyleToggle.tsx)
│   └── impersonation-banner.tsx      # (was impersonationBanner.tsx)
│
├── common/                           # Shared widgets & error boundaries
│   ├── error-feedback.tsx
│   ├── feedback-dialog.tsx           # (was feedbackDialog.tsx)
│   ├── heartbeat.tsx
│   ├── section-error-fallback.tsx    # (was sectionErrorFallback.tsx)
│   └── verify-email-button.tsx       # (was verifyEmailButton.tsx)
│
├── overview/                         # User Overview (/dashboard)
│   └── install-app-card.tsx          # (was installAppCard.tsx)
│
├── settings/                         # User Account Settings (/dashboard/settings)
│   ├── account-details-card.tsx      # (was accountDetailsCard.tsx)
│   ├── delete-account-card.tsx       # (was deleteAccountCard.tsx)
│   ├── passkeys-card.tsx             # (was passkeysCard.tsx)
│   ├── profile-card.tsx              # (was profileCard.tsx)
│   ├── two-factor-card.tsx           # (was twoFactorCard.tsx)
│   ├── marketing-updates-card.tsx    # (was marketingUpdatesCard.tsx)
│   └── sessions/                     # Grouped session management
│       ├── sessions-card.tsx
│       ├── sessions-section.tsx
│       └── skeletons/
│           └── sessions-card-skeleton.tsx
│
└── admin/                            # Admin Module (/dashboard/admin/*)
    ├── home/                         # Admin Landing Hub (/admin)
    │   ├── admin-stats-grid.tsx      # (was adminStatsGrid.tsx)
    │   ├── device-throttle-card.tsx   # (was deviceThrottleCard.tsx)
    │   ├── device-throttle-table.tsx  # (was deviceThrottleTable.tsx)
    │   ├── new-device-card.tsx        # (was newDeviceCard.tsx)
    │   ├── new-device-table.tsx       # (was newDeviceTable.tsx)
    │   ├── shared-device-card.tsx    # (was sharedDeviceCard.tsx)
    │   ├── shared-device-table.tsx   # (was sharedDeviceTable.tsx)
    │   └── skeletons/
    │       └── admin-stats-skeleton.tsx
    │
    ├── users/                        # Admin User Management (/admin/users)
    │   ├── admin-user-actions.tsx
    │   ├── admin-user-profile-card.tsx
    │   ├── admin-user-security-card.tsx
    │   ├── admin-user-status-card.tsx
    │   ├── admin-users-table.tsx
    │   ├── impersonation-tab.tsx
    │   ├── impersonation-log-card.tsx
    │   ├── invite-user-dialog.tsx
    │   ├── revoke-all-sessions.tsx    # (was revokeAllSessionsButton.tsx)
    │   └── detail/                   # Cards specific to /admin/users/[id]
    │       ├── admin-user-activity-log-card.tsx
    │       ├── admin-user-consent-card.tsx
    │       ├── admin-user-devices-card.tsx
    │       ├── admin-user-login-info-card.tsx
    │       └── admin-user-sessions-card.tsx
    │
    ├── activity-logs/                 # Admin Audit Logs (/admin/activity-logs)
    │   ├── activity-logs-section.tsx
    │   ├── admin-activity-logs-table.tsx
    │   ├── audit-severity-badge.tsx
    │   ├── security-highlights-collapsible.tsx
    │   └── skeletons/
    │       └── activity-logs-skeleton.tsx
    │
    ├── system-settings/              # Admin System Config (/admin/system-settings)
    │   ├── system-settings-form.tsx
    │   ├── system-settings-section.tsx
    │   ├── feedback-test-form.tsx
    │   └── skeletons/
    │       └── system-settings-skeleton.tsx
    │
    └── marketing/                    # Broadcasts & Campaigns (/admin/marketing)
        ├── broadcast-actions.tsx
        ├── confirm-send-dialog.tsx
        ├── marketing-email-form.tsx
        ├── marketing-section.tsx
        └── subscribers-card.tsx
```

---

## 3. Recommended Naming Standards

Switch from `camelCase` file names (`accountDetailsCard.tsx`) to standard **`kebab-case`** (`account-details-card.tsx`).

### Why `kebab-case` for Next.js Component Files?
* Matches modern Next.js conventions (e.g., `page.tsx`, `layout.tsx`, `loading.tsx`).
* Avoids cross-platform git case-sensitivity bugs when switching between macOS/Linux CI pipelines.
* Clean separation of multi-word components (e.g., `device-throttle-table.tsx` vs `devicethrottletable.tsx`).

---

## 4. Sub-Domain Mapping Reference Table

| Current Path | Proposed Path | Domain / Route Target |
| :--- | :--- | :--- |
| `admin/adminStatsGrid.tsx` | `admin/home/admin-stats-grid.tsx` | `/dashboard/admin` |
| `admin/deviceThrottleCard.tsx` | `admin/home/device-throttle-card.tsx` | `/dashboard/admin` |
| `admin/newDeviceCard.tsx` | `admin/home/new-device-card.tsx` | `/dashboard/admin` |
| `admin/adminUsersTable.tsx` | `admin/users/admin-users-table.tsx` | `/dashboard/admin/users` |
| `admin/impersonationTab.tsx` | `admin/users/impersonation-tab.tsx` | `/dashboard/admin/users?tab=impersonation` |
| `admin/adminUserConsentCard.tsx` | `admin/users/detail/admin-user-consent-card.tsx` | `/dashboard/admin/users/[id]` |
| `admin/activityLogsSection.tsx` | `admin/activity-logs/activity-logs-section.tsx` | `/dashboard/admin/activity-logs` |
| `admin/securityHighlightsCollapsible.tsx` | `admin/activity-logs/security-highlights-collapsible.tsx` | `/dashboard/admin/activity-logs` |
| `admin/systemSettingsForm.tsx` | `admin/system-settings/system-settings-form.tsx` | `/dashboard/admin/system-settings` |
| `admin/broadcastActions.tsx` | `admin/marketing/broadcast-actions.tsx` | `/dashboard/admin/marketing` |
| `appSidebar.tsx` | `layout/app-sidebar.tsx` | Global Layout Shell |
| `dashboardHeader.tsx` | `layout/dashboard-header.tsx` | Global Layout Shell |
| `passkeysCard.tsx` | `settings/passkeys-card.tsx` | `/dashboard/settings` |
| `twoFactorCard.tsx` | `settings/two-factor-card.tsx` | `/dashboard/settings` |

---

## 5. Migration Execution Strategy

1. **Create Subfolders:**
   ```bash
   mkdir -p components/dashboard/{layout,common,overview,settings/sessions/skeletons,admin/{home/skeletons,users/detail,activity-logs/skeletons,system-settings/skeletons,marketing}}
   ```
2. **Move & Rename Files:** Relocate files using an IDE with automated import path updating (e.g., VS Code or WebStorm) to preserve TS module paths.
3. **Group Skeletons:** Move all `*Skeleton.tsx` components into dedicated `skeletons/` subfolders within each feature route to reduce main folder clutter.
4. **Verify Route Pages:** Ensure `app/dashboard/**/page.tsx` routes consume components cleanly from their corresponding `@/components/dashboard/[route-domain]/` directories.