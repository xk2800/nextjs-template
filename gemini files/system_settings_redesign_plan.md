# System Settings Redesign & Feature Expansion Plan

## 1. Executive Summary

The **System Settings** page (`/dashboard/admin/system-settings`) provides runtime configuration toggles that allow administrators to control application behavior without redeploying code. It currently manages dynamic authentication toggles (Google Sign-In, Email/Password, Google One Tap), session revocation privileges, GDPR consent rules, and feedback error reporting.

While these live feature flags are a massive asset for a SaaS starter template, the current layout lacks explicit **Environment Variable override warnings**, a dedicated **Maintenance Mode control card** (despite being mentioned in the page subtitle), real-time **save state indicators**, and clear visual separation for test actions.

This plan details UX refinements and structural additions to turn this page into a resilient, production-ready system configuration hub.

## 2. Audit & Enhancement Opportunities

| Feature / Area | Current State | Proposed Enhancement | 
| ----- | ----- | ----- | 
| **Maintenance Mode** | Page subtitle states *"Feature flags and maintenance mode"*, but no Maintenance Mode control is visible. | Add a high-visibility **Maintenance Mode & Operational Status** card at the top, complete with custom user-facing banner message inputs and access bypass roles. | 
| **Environment Key Status** | Switches can be toggled on even if required `.env` keys (e.g., `GOOGLE_CLIENT_ID`) are missing. | Add **Environment Status Badges** (`Missing .env key` or `Overridden by ENV`) next to toggles so admins know if a feature is ready to be enabled. | 
| **Save State Feedback** | Subtitle notes *"changes take effect immediately"*, but there is no visual feedback when toggles are switched. | Add inline **Status Indicators** (`● Saving...` $\rightarrow$ `✓ Saved`) or automatic toast notifications when a switch state updates in the database. | 
| **Developer Test Actions** | Test actions (e.g. *"Test error reporting"*) sit at the bottom as plain cards without clear visual distinction. | Group testing tools and webhooks into an **Integrations & Diagnostics** card using explicit outline buttons with loading states. | 
| **Navigation & Indexing** | Settings are rendered as a long scrolling list of cards without internal navigation. | Add sticky internal section tabs (`Authentication`, `Maintenance`, `Privacy & Consent`, `Diagnostics`) or a quick page anchor index for fast navigation. | 

## 3. Structural Wireframe

```
+-----------------------------------------------------------------------------------------+
| System Settings                                                                         |
| Feature flags and runtime configuration — changes take effect immediately               |
+-----------------------------------------------------------------------------------------+
| [ Anchors: 🛡️ Maintenance | 🔑 Auth & Sessions | 📜 Privacy & Consent | 🧪 Diagnostics ] |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
| 1. MAINTENANCE & OPERATIONAL CONTROL                                                    |
| +-------------------------------------------------------------------------------------+ |
| | Maintenance Mode                                                      [ Toggle OFF ]| |
| | Restrict application access to administrators during database migrations.           | |
| | Message: "We are currently performing scheduled maintenance. Back online shortly."  | |
| +-------------------------------------------------------------------------------------+ |
|                                                                                         |
| 2. AUTHENTICATION & SESSIONS                                                            |
| +-------------------------------------------------------------------------------------+ |
| | Google Sign-In                        [ Active Badge ]               [ Toggle ON  ]| |
| | Show Google button and accept sign-ins                                              | |
| |                                                                                     | |
| | Email & Password Sign-In              [ Active Badge ]               [ Toggle ON  ]| |
| | Show email/password form and signup page                                            | |
| |                                                                                     | |
| | Google One Tap                       [ ⚠️ Missing .env key ]        [ Disabled   ]| |
| | Show One Tap prompt on load (requires GOOGLE_CLIENT_ID)                             | |
| +-------------------------------------------------------------------------------------+ |
|                                                                                         |
| 3. PRIVACY, CONSENT & DIAGNOSTICS                                                       |
| +-------------------------------------------------------------------------------------+ |
| | Require GDPR Consent Banner                                          [ Toggle ON  ]| |
| | Attach Error Details to Feedback                                     [ Toggle ON  ]| |
| | Test Error Pipeline                                                  [ Send Test ] | |
| +-------------------------------------------------------------------------------------+ |
|                                                                                         |
+-----------------------------------------------------------------------------------------+

```

## 4. Detailed Component Breakdown

### 1. Maintenance Mode Card

* **File:** `@/components/admin/settings/maintenance-mode-card.tsx`

* **Features:**

  * **Global Toggle:** Turn Maintenance Mode on/off globally.

  * **Bypass Role Selector:** Choose which roles can bypass the lock screen (`admin` only by default).

  * **Custom Lock Message:** Text input allowing admins to set the announcement string displayed on the maintenance screen.

### 2. Smart Feature Switch with Env Checking

* **File:** `@/components/admin/settings/env-aware-switch.tsx`

* **Features:**

  * Checks whether required server environment variables exist before allowing toggling.

  * Displays helpful pill badges:

    * 🟢 `Ready` — Configured in `.env` and enabled.

    * 🟡 `Disabled in ENV` — Hard-disabled in server configuration.

    * 🔴 `Missing Key` — Requires missing `.env` variable before turning on.

### 3. Save State Toast / Badge

* **File:** `@/components/admin/settings/setting-row.tsx`

* **Features:** Instant visual status transition:

  * Shows `Saving...` spinner adjacent to the switch when clicked.

  * Triggers a subtle success toast: *"Google Sign-In setting updated successfully"*.

### 4. Integrations & Diagnostics Panel

* **File:** `@/components/admin/settings/diagnostics-card.tsx`

* **Features:** Houses webhook configuration fields (e.g. `FEEDBACK_DISCORD_WEBHOOK_URL`) and developer trigger buttons (*Test Sentry Error*, *Send Test Feedback Webhook*).

## 5. Code Architecture Blueprint (`app/dashboard/admin/system-settings/page.tsx`)

```
import { MaintenanceModeCard } from "./_components/maintenance-mode-card";
import { AuthSessionsCard } from "./_components/auth-sessions-card";
import { PrivacyConsentCard } from "./_components/privacy-consent-card";
import { DiagnosticsCard } from "./_components/diagnostics-card";

export default function SystemSettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">
          Feature flags and runtime configuration — changes take effect immediately across all servers.
        </p>
      </div>

      {/* System Settings Cards Stack */}
      <div className="space-y-6">
        {/* 1. Maintenance & Operation Lock */}
        <MaintenanceModeCard />

        {/* 2. Authentication Methods & Session Controls */}
        <AuthSessionsCard />

        {/* 3. Privacy, Cookie Consent & Compliance */}
        <PrivacyConsentCard />

        {/* 4. Diagnostics, Webhooks & Feedback */}
        <DiagnosticsCard />
      </div>
    </div>
  );
}

```

## 6. Implementation Checklist

* \[ \] Build `<MaintenanceModeCard />` with toggle switch, custom message input, and bypass role options.

* \[ \] Create `<EnvAwareSwitch />` component that inspects environment key availability (`GOOGLE_CLIENT_ID`, etc.).

* \[ \] Add visual `Missing .env key` warning badges to prevent admins from toggling unconfigured providers.

* \[ \] Add real-time optimistic loading UI (`Saving...` badge / toast) for settings updates.

* \[ \] Move test actions (*Test error reporting*) into `<DiagnosticsCard />` with proper button UI.

* \[ \] Restrict access to this page so only users with `role: "admin"` can mutate settings API endpoints.