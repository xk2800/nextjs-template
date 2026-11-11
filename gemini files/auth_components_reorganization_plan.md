# Auth Components Reorganization Plan

## 1. Context & Structural Bottlenecks

Currently, your `components/auth` directory contains 13 flat component files. While manageable, mixing layout shells, login methods, password reset flows, MFA forms, and session utilities in a single root folder makes it difficult to maintain as auth mechanisms grow (e.g., adding WebAuthn, OAuth providers, or magic links).

### Identified Issues:

1. **Mixed Responsibility:** Layout shells (`authShell.tsx`) sit right next to specific forms (`twoFactorVerifyForm.tsx`) and session actions (`logoutButtons.tsx`).
2. **Inconsistent Naming:** File names use `camelCase` (`emailPasswordLogin.tsx`, `forgotPasswordForm.tsx`). Standard Next.js/React convention uses **`kebab-case`** (`email-password-login.tsx`) to prevent case-sensitivity bugs across cross-platform CI environments (Linux vs. macOS).
3. **Lack of Flow Grouping:** Password recovery forms (`forgotPasswordForm.tsx`, `resetPasswordForm.tsx`) are separated by alphabetical sorting rather than being grouped by authentication flow.

## 2. Proposed Directory Architecture

Organize the `components/auth` folder into sub-directories categorized by **auth flow and functional responsibility**:

```
components/auth/
├── layout/                         # Auth card containers & page shells
│   ├── auth-card.tsx               # (was authCard.tsx)
│   └── auth-shell.tsx              # (was authShell.tsx)
│
├── forms/                          # Core credential forms
│   ├── login-form.tsx              # (was emailPasswordLogin.tsx)
│   ├── signup-form.tsx             # (was emailPasswordSignup.tsx)
│   └── login-error-recovery.tsx    # (was loginErrorRecovery.tsx)
│
├── methods/                        # Secondary auth mechanisms / providers
│   ├── social-login.tsx            # (was socialLogin.tsx)
│   ├── passkey-login.tsx           # (was passkeyLogin.tsx)
│   └── one-tap.tsx                 # (was oneTap.tsx)
│
├── recovery/                       # Password reset & account recovery flow
│   ├── forgot-password-form.tsx    # (was forgotPasswordForm.tsx)
│   └── reset-password-form.tsx     # (was resetPasswordForm.tsx)
│
├── mfa/                            # Multi-factor authentication
│   └── two-factor-verify-form.tsx  # (was twoFactorVerifyForm.tsx)
│
└── session/                        # Session state & device verification
    ├── device-check.tsx            # (was deviceCheck.tsx)
    └── logout-buttons.tsx          # (was logoutButtons.tsx)
```

## 3. Migration Reference Table

| Current Path | Proposed Path | Categorization |
| ----- | ----- | ----- |
| `auth/authCard.tsx` | `auth/layout/auth-card.tsx` | Layout Shell |
| `auth/authShell.tsx` | `auth/layout/auth-shell.tsx` | Layout Shell |
| `auth/emailPasswordLogin.tsx` | `auth/forms/login-form.tsx` (or `email-password-login.tsx`) | Primary Auth Form |
| `auth/emailPasswordSignup.tsx` | `auth/forms/signup-form.tsx` (or `email-password-signup.tsx`) | Primary Auth Form |
| `auth/loginErrorRecovery.tsx` | `auth/forms/login-error-recovery.tsx` | Auth Error Handling |
| `auth/socialLogin.tsx` | `auth/methods/social-login.tsx` | Auth Provider |
| `auth/passkeyLogin.tsx` | `auth/methods/passkey-login.tsx` | Auth Provider |
| `auth/oneTap.tsx` | `auth/methods/one-tap.tsx` | Auth Provider |
| `auth/forgotPasswordForm.tsx` | `auth/recovery/forgot-password-form.tsx` | Account Recovery |
| `auth/resetPasswordForm.tsx` | `auth/recovery/reset-password-form.tsx` | Account Recovery |
| `auth/twoFactorVerifyForm.tsx` | `auth/mfa/two-factor-verify-form.tsx` | 2FA / MFA |
| `auth/deviceCheck.tsx` | `auth/session/device-check.tsx` | Session / Device Security |
| `auth/logoutButtons.tsx` | `auth/session/logout-buttons.tsx` | Session Control |

## 4. Implementation Steps

1. **Create Subfolders:**
   ```bash
   mkdir -p components/auth/{layout,forms,methods,recovery,mfa,session}
   ```

2. **Move & Rename File Actions:** Use VS Code or WebStorm file rename actions (`F2`) to move files so IDE auto-imports update across routes like `/login`, `/signup`, `/forgot-password`, and `/reset-password`.

3. **Optional Index Exports (`index.ts`):** Create clean barrel exports if you prefer concise imports:
   ```typescript
   // components/auth/index.ts
   export * from "./layout/auth-card";
   export * from "./layout/auth-shell";
   export * from "./forms/login-form";
   export * from "./forms/signup-form";
   ```

4. **Verify Route Pages:** Ensure your public auth routes in `app/(auth)/` import smoothly from `@/components/auth/...`.