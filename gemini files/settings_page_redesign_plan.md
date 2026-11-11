# Settings Page Redesign Plan & Tab Architecture

## 1. Executive Summary

The current `/dashboard/settings` page displays appearance settings and two-factor authentication controls under a tab labeled "Profile & activity". To eliminate navigation confusion and build a clean settings experience, we will restructure the page into distinct, focused sub-tabs.

This redesign also integrates the **User Profile**, **Account Details**, and **Active Sessions** components previously located on the main `/dashboard` Overview page.

---

## 2. Structural Mismatch & Audit

| Issue Area | Current State | Target State |
| :--- | :--- | :--- |
| **Tab Labels** | "Profile & activity" tab displays Theme options instead of profile forms. | Clear, single-responsibility sub-tabs: **Profile**, **Security & Sessions**, **Appearance**, and **Notifications**. |
| **Account Info** | User metadata (Avatar, Role, Email status) sits on the main Overview dashboard. | Integrated into `Settings > Profile`. |
| **Session Logs** | Active IP session table sits on the main Overview dashboard. | Integrated into `Settings > Security & Sessions` alongside session revocation actions. |
| **Security Controls** | Basic 2FA and Passkey cards without enrolled device listing or key management. | Complete security management hub powered by Better-Auth actions. |

---

## 3. Sub-Tab Architecture Blueprint

```
+---------------------------------------------------------------------------------+
|  Settings                                                                       |
|  Manage your account preferences and security configuration.                    |
|                                                                                 |
|  [ Profile ]   [ Security & Sessions ]   [ Appearance ]   [ Notifications ]    |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  Tab Content Container                                                          |
|  (Renders selected sub-section cards)                                           |
|                                                                                 |
+---------------------------------------------------------------------------------+
```

---

## 4. Sub-Tab Detailed Breakdown

### Tab 1: Profile (`/dashboard/settings?tab=profile`)
* **User Profile Card:** Avatar upload/picker, Display Name field, and Primary Email address with verification badge.
* **Account Status Card:** Account Role indicator (`admin` / `user`), Account Creation Date, and Last Updated timestamp.
* **Password Change Card:** Standard form for updating password (`Current Password`, `New Password`, `Confirm Password`).
* **Danger Zone Card:** Destructive action area for requesting account deletion or workspace offboarding.

### Tab 2: Security & Sessions (`/dashboard/settings?tab=security`)
* **Two-Factor Authentication (2FA):** Status toggle, QR code pairing setup modal, and emergency backup codes generator.
* **Passkeys Management:** Enrolled passkeys list (showing Device Name, Platform, Added Date, and Delete CTA) paired with the `Add Passkey` form.
* **Active Sessions Table:** Full session table transferred from Overview:
  * IP Address & Browser User-Agent string.
  * Created Date & Expiration Date.
  * **Revoke Session Button:** Triggers `better-auth` session revocation API endpoint.

### Tab 3: Appearance (`/dashboard/settings?tab=appearance`)
* **Theme Selector:** Light / Dark / System preference cards (retained from current implementation).
* **Regional & Localization:** Language dropdown selection and Timezone selector.
* **Accessibility Settings:** Reduced motion toggle and high-contrast UI mode settings.

### Tab 4: Notifications (`/dashboard/settings?tab=notifications`)
* **Email Preferences:** Toggle matrix for product updates, security alerts, weekly digests, and marketing emails.
* **In-App Alerts:** Preferences for push notifications or operational toast alerts.

---

## 5. Code Architecture Template

Below is the updated layout structure for `app/dashboard/settings/page.tsx` using Shadcn UI tabs:

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSection } from "./_components/profile-section";
import { SecuritySection } from "./_components/security-section";
import { AppearanceSection } from "./_components/appearance-section";
import { NotificationSection } from "./_components/notification-section";

export default function SettingsPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences, security configuration, and active sessions.
        </p>
      </div>

      {/* Sub-Tab Navigation */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileSection />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecuritySection />
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceSection />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## 6. Migration & Implementation Checklist

- [ ] Create `_components/` directory inside `app/dashboard/settings/`.
- [ ] Move Profile and Account Details cards into `profile-section.tsx`.
- [ ] Move Active Sessions table and 2FA/Passkey cards into `security-section.tsx`.
- [ ] Extract Theme selector into `appearance-section.tsx`.
- [ ] Add session revocation handlers to the Active Sessions list.
- [ ] Test tab switching state and URL query parameter sync (`?tab=security`).