import { getSystemSettings, getConfiguredAuthFlags } from "@xk2800/nextjs-template/settings/queries"
import SystemSettingsForm from "./systemSettingsForm"

export default async function SystemSettingsSection() {
  const settings = await getSystemSettings()
  const configuredFlags = getConfiguredAuthFlags()

  return <SystemSettingsForm initialSettings={settings} configuredFlags={configuredFlags} />
}
