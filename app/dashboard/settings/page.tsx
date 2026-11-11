import {
  SettingsNav,
  SETTINGS_TABS,
  type SettingsTab,
  ProfileSection,
  SecuritySection,
  AppearanceSection,
  NotificationsSection,
} from "@/components/settings"

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const active: SettingsTab = SETTINGS_TABS.find((t) => t.value === tab)?.value ?? "profile"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account, security, appearance and notifications
        </p>
      </div>

      <SettingsNav active={active} />

      {active === "profile" && <ProfileSection />}
      {active === "security" && <SecuritySection />}
      {active === "appearance" && <AppearanceSection />}
      {active === "notifications" && <NotificationsSection />}
    </div>
  )
}
