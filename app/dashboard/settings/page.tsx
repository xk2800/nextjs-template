import { SettingsNav, SETTINGS_TABS, type SettingsTab } from "./_components/settings-nav"
import { ProfileSection } from "./_components/profile-section"
import { SecuritySection } from "./_components/security-section"
import { AppearanceSection } from "./_components/appearance-section"
import { NotificationsSection } from "./_components/notifications-section"

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
