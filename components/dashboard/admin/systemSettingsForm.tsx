'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card"
import { Switch } from "../../ui/switch"
import { Label } from "../../ui/label"
import { Textarea } from "../../ui/textarea"
import { Button } from "../../ui/button"
import type { SystemSettings } from "@xk2800/nextjs-template/settings/queries"
import { ALWAYS_OPEN_PATHS, DEFAULT_MAINTENANCE_EXEMPT_PATHS } from "../../../lib/maintenance"

interface ConfiguredAuthFlags {
  google: boolean
  emailPassword: boolean
  oneTap: boolean
}

interface SystemSettingsFormProps {
  initialSettings: SystemSettings
  configuredFlags: ConfiguredAuthFlags
}

export default function SystemSettingsForm({ initialSettings, configuredFlags }: SystemSettingsFormProps) {
  const router = useRouter()
  const [settings, setSettings] = useState(initialSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [exemptPathsText, setExemptPathsText] = useState(initialSettings.maintenanceExemptPaths.join('\n'))
  const exemptPaths = exemptPathsText.split('\n').map((p) => p.trim()).filter(Boolean)

  // "Left enabled" means actually usable — configured (env) AND toggled on
  // (DB) — not just the DB toggle, which can look "on" while being fully
  // inert if the env var for that method is off.
  const anySignInMethodLeft =
    (configuredFlags.google && settings.authEnableGoogle) ||
    (configuredFlags.emailPassword && settings.authEnableEmailPassword)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maintenanceMode: settings.maintenanceMode,
          maintenanceMessage: settings.maintenanceMessage,
          maintenanceExemptPaths: exemptPaths,
          authEnableGoogle: settings.authEnableGoogle,
          authEnableEmailPassword: settings.authEnableEmailPassword,
          authEnableOneTap: settings.authEnableOneTap,
          enableSessionRevocation: settings.enableSessionRevocation,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to save settings')

      toast.success('Settings saved')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Authentication & Sessions</CardTitle>
          <CardDescription>
            Live toggles on top of what&apos;s configured via environment variables —
            a method disabled here stops working immediately, without a redeploy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="google-toggle">Google sign-in</Label>
              <p className="text-sm text-gray-500">Show the Google button and accept sign-ins</p>
              {!configuredFlags.google && (
                <p className="text-sm text-amber-600 dark:text-amber-500">
                  Not configured for this deployment — set AUTH_ENABLE_GOOGLE=true (and Google credentials)
                  to unlock this toggle
                </p>
              )}
            </div>
            <Switch
              id="google-toggle"
              checked={settings.authEnableGoogle}
              disabled={!configuredFlags.google}
              onCheckedChange={(checked) => setSettings({ ...settings, authEnableGoogle: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-toggle">Email &amp; password sign-in</Label>
              <p className="text-sm text-gray-500">Show the email/password form and signup page</p>
              {!configuredFlags.emailPassword && (
                <p className="text-sm text-amber-600 dark:text-amber-500">
                  Not configured for this deployment — set AUTH_ENABLE_EMAIL_PASSWORD=true to unlock this toggle
                </p>
              )}
            </div>
            <Switch
              id="email-toggle"
              checked={settings.authEnableEmailPassword}
              disabled={!configuredFlags.emailPassword}
              onCheckedChange={(checked) => setSettings({ ...settings, authEnableEmailPassword: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="onetap-toggle">Google One Tap</Label>
              <p className="text-sm text-gray-500">
                Show the One Tap prompt on load — a shortcut into Google sign-in, not a
                separate method; it stops working if Google sign-in above is off
              </p>
              {!configuredFlags.oneTap ? (
                <p className="text-sm text-amber-600 dark:text-amber-500">
                  Not configured for this deployment — set AUTH_ENABLE_ONE_TAP=true
                  (and NEXT_PUBLIC_AUTH_ENABLE_ONE_TAP=true) to unlock this toggle
                </p>
              ) : !settings.authEnableGoogle && (
                <p className="text-sm text-amber-600 dark:text-amber-500">
                  Requires Google sign-in to be enabled above
                </p>
              )}
            </div>
            <Switch
              id="onetap-toggle"
              checked={settings.authEnableOneTap}
              disabled={!configuredFlags.oneTap}
              onCheckedChange={(checked) => setSettings({ ...settings, authEnableOneTap: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="revoke-toggle">Session revocation</Label>
              <p className="text-sm text-gray-500">Let users revoke their own sessions from Settings</p>
            </div>
            <Switch
              id="revoke-toggle"
              checked={settings.enableSessionRevocation}
              onCheckedChange={(checked) => setSettings({ ...settings, enableSessionRevocation: checked })}
            />
          </div>

          {!anySignInMethodLeft && (
            <p className="text-sm text-destructive">
              At least one sign-in method must stay enabled, or nobody will be able to sign in.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Mode</CardTitle>
          <CardDescription>
            Blocks every page and API route except the paths kept open below, and shows a
            maintenance page instead — admins keep full access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="maintenance-toggle">Maintenance mode</Label>
              <p className="text-sm text-gray-500">Non-admins are redirected to /maintenance</p>
            </div>
            <Switch
              id="maintenance-toggle"
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
            />
          </div>

          {settings.maintenanceMode && (
            <div className="space-y-2">
              <Label htmlFor="maintenance-message">Message shown to visitors (optional)</Label>
              <Textarea
                id="maintenance-message"
                value={settings.maintenanceMessage ?? ''}
                onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value || null })}
                placeholder="We'll be back shortly."
                maxLength={2000}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="maintenance-exempt">Paths that stay open during maintenance</Label>
            <p className="text-sm text-gray-500">
              One per line. <code>/foo</code> also opens <code>/foo/...</code>; <code>/</code> opens
              only the home page. Always open regardless: {ALWAYS_OPEN_PATHS.join(', ')}
            </p>
            <Textarea
              id="maintenance-exempt"
              value={exemptPathsText}
              onChange={(e) => setExemptPathsText(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setExemptPathsText(DEFAULT_MAINTENANCE_EXEMPT_PATHS.join('\n'))}
            >
              Reset to public pages
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || !anySignInMethodLeft}>
          {isSaving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}
