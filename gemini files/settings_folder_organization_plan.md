# Settings Folder Organization Plan

## 1. Current Assessment

Your `settings/` directory currently contains 5 components:

* `appearance-section.tsx`
* `notifications-section.tsx`
* `profile-section.tsx`
* `security-section.tsx`
* `settings-nav.tsx`

### Assessment:
This folder is **already cleanly aligned with the 4 sub-tabs** defined in the [Settings Page Redesign Plan](docs/settings-page-redesign.md). Each file represents a primary section container for its corresponding tab (`Profile`, `Security`, `Appearance`, `Notifications`), along with `settings-nav.tsx` for tab navigation controls.

However, as you break down large section containers into smaller, reusable child cards (e.g. moving `2FA`, `Passkeys`, `Sessions`, `Avatar Upload`, and `Delete Account` cards into modular components), keeping everything flat in one folder will lead to clutter.

---

## 2. Recommended Directory Architecture

To ensure the folder remains clean as features grow, group granular child cards under dedicated subdirectories matching each tab section:

```
components/dashboard/settings/
├── index.ts                     # Barrel export for clean page imports
├── settings-nav.tsx             # Primary tab navigation header / sidebar
│
├── profile/                     # Profile Tab Components
│   ├── profile-section.tsx      # Main tab wrapper container
│   ├── profile-card.tsx         # Avatar & display name form
│   ├── account-details-card.tsx # Role & registration metadata
│   └── delete-account-modal.tsx # Danger zone account deletion dialog
│
├── security/                    # Security & Sessions Tab Components
│   ├── security-section.tsx     # Main tab wrapper container
│   ├── two-factor-card.tsx      # 2FA toggle & QR code modal
│   ├── passkeys-card.tsx        # Enrolled hardware security keys
│   ├── password-change-card.tsx # Password reset form
│   └── active-sessions-table.tsx# IP session log & revocation table
│
├── appearance/                  # Appearance & Localization Components
│   ├── appearance-section.tsx   # Main tab wrapper container
│   ├── theme-selector-card.tsx  # Light / Dark / System radio selector
│   └── timezone-picker.tsx      # Regional settings
│
└── notifications/               # Notification Preferences Components
    ├── notifications-section.tsx# Main tab wrapper container
    └── email-preferences-card.tsx# Notification toggle matrix
```

---

## 3. Migration & Categorization Reference Table

| Current File | Proposed Location | Role / Responsibility |
| :--- | :--- | :--- |
| `settings-nav.tsx` | `settings/settings-nav.tsx` | Top Tab Pills / Secondary Sub-nav |
| `profile-section.tsx` | `settings/profile/profile-section.tsx` | Tab Container for Profile Forms |
| `security-section.tsx` | `settings/security/security-section.tsx` | Tab Container for 2FA, Passkeys & Sessions |
| `appearance-section.tsx` | `settings/appearance/appearance-section.tsx` | Tab Container for Theme & UI Customization |
| `notifications-section.tsx` | `settings/notifications/notifications-section.tsx` | Tab Container for Email & App Alerts |

---

## 4. Barrel Export Pattern (`index.ts`)

Adding an `index.ts` file inside `components/dashboard/settings/` enables clean, single-line imports in your main `app/dashboard/settings/page.tsx` file.

```typescript
// components/dashboard/settings/index.ts
export * from "./settings-nav";
export * from "./profile/profile-section";
export * from "./security/security-section";
export * from "./appearance/appearance-section";
export * from "./notifications/notifications-section";
```

### Clean Page Usage (`app/dashboard/settings/page.tsx`):

```tsx
import {
  SettingsNav,
  ProfileSection,
  SecuritySection,
  AppearanceSection,
  NotificationSection,
} from "@/components/dashboard/settings";

export default function SettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <SettingsNav />
      {/* Tab Panels */}
    </div>
  );
}
```

---

## 5. Implementation Checklist

* [ ] Add `index.ts` to `components/dashboard/settings/` for clean exports.
* [ ] Create sub-folders (`profile/`, `security/`, `appearance/`, `notifications/`) as child cards are extracted.
* [ ] Move existing card components (such as `twoFactorCard.tsx`, `passkeysCard.tsx`, `sessionsCard.tsx`) into their respective section sub-folders.
* [ ] Update import references in `app/dashboard/settings/page.tsx`.