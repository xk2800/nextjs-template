import { getSystemSettings, getConfiguredAuthFlags, isConsentRequired } from "@xk2800/nextjs-template/settings/queries"
import SystemSettingsForm from "./systemSettingsForm"

export default async function SystemSettingsSection() {
  const settings = await getSystemSettings()
  const configuredFlags = getConfiguredAuthFlags()

  // Show the effective consent mode (null = NEXT_PUBLIC_COOKIE_BANNER default).
  return (
    <SystemSettingsForm
      initialSettings={{ ...settings, consentRequired: isConsentRequired(settings) }}
      configuredFlags={configuredFlags}
    />
  )
}
