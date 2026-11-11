# Email Templates Reorganization Plan

## 1. Context & Structural Bottlenecks

Currently, your `components/email` directory contains 10 flat files. While the number of files is small, several structural issues will cause friction as your application grows:

### Identified Issues:

1. **Repetitive Prefix Redundancy:** Every template starts with `email-template-` (e.g., `email-template-verify-email.tsx`). When files sit inside an `email/` folder, repeating `email-template-` in every filename creates unneeded noise.
2. **Mixing UI Components with React Email Templates:** `send-email-button.tsx` is an interactive client/server UI component, whereas the rest are static React Email HTML renderer templates. Placing interactive app buttons alongside email markup distorts component boundaries.
3. **Ambiguous Draft Names:** Files like `email-template.tsx` and `email-template-2.tsx` lack clear semantic purpose.
4. **Lack of Category Grouping:** Security notifications (`banned`, `new-device`, `passkey-change`) are mixed together with authentication flows (`welcome`, `verify-email`, `reset-password`) and team invites.

---

## 2. Proposed Directory Architecture

Organize your email system into **domain categories** (Auth, Security, Team, Shared Layouts) and separate interactive app UI buttons into a dedicated `ui/` subfolder (or main UI components).

```
components/email/
├── layout/                         # Reusable email wrapper & design system
│   ├── base-layout.tsx             # (was email-template.tsx - header, footer, logo)
│   ├── email-button.tsx            # Styled HTML button component inside emails
│   └── email-header.tsx            # Standard brand header
│
├── auth/                           # Authentication & Onboarding templates
│   ├── welcome.tsx                 # (was email-template-welcome.tsx)
│   ├── verify-email.tsx            # (was email-template-verify-email.tsx)
│   └── reset-password.tsx          # (was email-template-reset-password.tsx)
│
├── security/                       # Account security & alert templates
│   ├── account-banned.tsx          # (was email-template-banned.tsx)
│   ├── new-device-alert.tsx        # (was email-template-new-device.tsx)
│   └── passkey-changed.tsx         # (was email-template-passkey-change.tsx)
│
├── team/                           # Team & Workspace management
│   └── workspace-invite.tsx        # (was email-template-invite.tsx)
│
├── marketing/                      # Marketing & Announcement templates
│   └── general-announcement.tsx    # (was email-template-2.tsx)
│
└── ui/                             # Dashboard / Web App UI components
    └── send-email-button.tsx       # Interactive app button triggering email APIs

```

> **Note:** If you are using [React Email](https://react.email) with a dedicated preview server (`email dev`), it is common practice to place templates in an `/emails` directory at the project root (`emails/auth/welcome.tsx`). If you prefer keeping them inside `components/`, the structure above is ideal.

---

## 3. Migration Mapping Table

| Current Path | Proposed Path | Domain / Category |
| ----- | ----- | ----- |
| `email/email-template.tsx` | `email/layout/base-layout.tsx` | Base Layout / Wrapper |
| `email/email-template-2.tsx` | `email/marketing/general-announcement.tsx` | Marketing |
| `email/email-template-welcome.tsx` | `email/auth/welcome.tsx` | Auth / Onboarding |
| `email/email-template-verify-email.tsx` | `email/auth/verify-email.tsx` | Auth |
| `email/email-template-reset-password.tsx` | `email/auth/reset-password.tsx` | Auth |
| `email/email-template-banned.tsx` | `email/security/account-banned.tsx` | Security Alert |
| `email/email-template-new-device.tsx` | `email/security/new-device-alert.tsx` | Security Alert |
| `email/email-template-passkey-change.tsx` | `email/security/passkey-changed.tsx` | Security Alert |
| `email/email-template-invite.tsx` | `email/team/workspace-invite.tsx` | Team / Organization |
| `email/send-email-button.tsx` | `email/ui/send-email-button.tsx` | Web App UI Trigger |

---

## 4. Best Practices for Email Templates

### A. Extract a Base Layout Wrapper

Instead of repeating HTML `<head>`, `<Container>`, brand logos, and footers in every template, create a `<BaseLayout>` wrapper:

```tsx
// components/email/layout/base-layout.tsx
import { Body, Container, Head, Html, Preview, Tailwind } from "@react-email/components";

interface BaseLayoutProps {
  previewText: string;
  children: React.ReactNode;
}

export function BaseLayout({ previewText, children }: BaseLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-slate-50 font-sans">
          <Container className="mx-auto my-10 max-w-lg rounded-lg border bg-white p-6 shadow-sm">
            {/* Standard Brand Logo Header */}
            <div className="mb-6 border-b pb-4">
              <h1 className="text-xl font-bold">Your App</h1>
            </div>

            {/* Template Specific Content */}
            {children}

            {/* Standard Footer */}
            <div className="mt-8 border-t pt-4 text-xs text-slate-500">
              © {new Date().getFullYear()} Your App Inc. All rights reserved.
            </div>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
```

### B. Clean Template Cleanroom Example

With the `<BaseLayout>` abstracted, individual templates become short and focused:

```tsx
// components/email/auth/welcome.tsx
import { Button, Heading, Text } from "@react-email/components";
import { BaseLayout } from "../layout/base-layout";

interface WelcomeEmailProps {
  userName?: string;
  loginUrl?: string;
}

export function WelcomeEmail({ userName = "User", loginUrl = "https://example.com/login" }: WelcomeEmailProps) {
  return (
    <BaseLayout previewText={`Welcome to Your App, ${userName}!`}>
      <Heading className="text-xl font-semibold">Welcome aboard, {userName}!</Heading>
      <Text className="text-slate-600">
        We're excited to have you get started. Click the button below to sign in to your dashboard.
      </Text>
      <Button href={loginUrl} className="mt-4 rounded-md bg-black px-5 py-3 text-sm font-medium text-white">
        Go to Dashboard
      </Button>
    </BaseLayout>
  );
}

export default WelcomeEmail;
```

---

## 5. Implementation Checklist

- [ ] Create subdirectories: `mkdir -p components/email/{layout,auth,security,team,marketing,ui}`.
- [ ] Move and rename files according to the mapping table.
- [ ] Build `<BaseLayout />` component to centralize brand styling, headers, and footers.
- [ ] Move `send-email-button.tsx` into `email/ui/` (or your main app `components/ui/` directory).
- [ ] Update Resend/Postmark email dispatch imports across `lib/email/` server functions.