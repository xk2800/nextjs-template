'use client'

import { useRef, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card"
import { Switch } from "../../ui/switch"
import { Label } from "../../ui/label"
import { Textarea } from "../../ui/textarea"
import { Button } from "../../ui/button"
import { Badge } from "../../ui/badge"
import type { SystemSettings } from "@xk2800/nextjs-template/settings/queries"
import FeedbackTestForm from "./feedbackTestForm"
import { ALWAYS_OPEN_PATHS, DEFAULT_MAINTENANCE_EXEMPT_PATHS } from "../../../lib/maintenance"

interface ConfiguredAuthFlags {
  google: boolean
  emailPassword: boolean
  oneTap: boolean
}

interface SystemSettingsFormProps {
  initialSettings: SystemSettings
  configuredFlags: ConfiguredAuthFlags
  /** Per-control env requirements (see getControlStatuses); a failing one disables its toggle and explains why. */
  controlStatus?: Record<string, ControlStatus>
}

type ControlStatus = { ok: true } | { ok: false; kind: 'flag' | 'keys'; reason: string }

type ToggleKey =
  | 'maintenanceMode'
  | 'authEnableGoogle'
  | 'authEnableEmailPassword'
  | 'authEnableOneTap'
  | 'enableSessionRevocation'
  | 'feedbackAttachErrors'
  | 'consentRequired'

const SECTIONS = [
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'auth', label: 'Auth & Sessions' },
  { id: 'privacy', label: 'Privacy & Consent' },
  { id: 'diagnostics', label: 'Diagnostics' },
]

// One switch row: label, description, optional badges/notes, and an inline
// Saving... / Saved indicator next to the switch.
function SettingRow({
  id, label, description, badge, note, blockedNote, checked, disabled, state, onChange,
}: {
  id: string
  label: ReactNode
  description: ReactNode
  badge?: ReactNode
  note?: ReactNode
  /** Shown first, and explains why the switch is disabled. */
  blockedNote?: ReactNode
  checked: boolean
  disabled?: boolean
  state?: 'saving' | 'saved'
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor={id}>{label}</Label>
          {badge}
        </div>
        <p className="text-sm text-gray-500">{description}</p>
        {blockedNote}
        {note}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {state === 'saving' && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="size-3 animate-spin" /> Saving...</span>
        )}
        {state === 'saved' && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"><Check className="size-3" /> Saved</span>
        )}
        {/* A control the environment blocks can't be on, whatever the stored value says. */}
        <Switch id={id} checked={checked && !blockedNote} disabled={disabled || state === 'saving'} onCheckedChange={onChange} />
      </div>
    </div>
  )
}

// Badge + note + disabled flag for a control, derived from its env requirements.
function envProps(status: ControlStatus | undefined, on: boolean) {
  if (!status) return {}
  if (status.ok) {
    return {
      badge: on
        ? <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Ready</Badge>
        : <Badge variant="outline">Off</Badge>,
    }
  }
  return {
    disabled: true,
    badge: (
      <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400">
        {status.kind === 'flag' ? 'Disabled in ENV' : 'Missing key'}
      </Badge>
    ),
    blockedNote: <p className="text-sm text-amber-600 dark:text-amber-500">Disabled: {status.reason}</p>,
  }
}

const LABELS: Record<ToggleKey, string> = {
  maintenanceMode: 'Maintenance mode',
  authEnableGoogle: 'Google sign-in',
  authEnableEmailPassword: 'Email & password sign-in',
  authEnableOneTap: 'Google One Tap',
  enableSessionRevocation: 'Session revocation',
  feedbackAttachErrors: 'Attach error details',
  consentRequired: 'Consent requirement',
}

export default function SystemSettingsForm({ initialSettings, configuredFlags, controlStatus = {} }: SystemSettingsFormProps) {
  const router = useRouter()
  const [settings, setSettings] = useState(initialSettings)
  const [rowState, setRowState] = useState<Partial<Record<ToggleKey, 'saving' | 'saved'>>>({})
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false)
  const [exemptPathsText, setExemptPathsText] = useState(initialSettings.maintenanceExemptPaths.join('\n'))
  const exemptPaths = exemptPathsText.split('\n').map((p) => p.trim()).filter(Boolean)
  const savedTimers = useRef<Partial<Record<ToggleKey, ReturnType<typeof setTimeout>>>>({})

  // "Left enabled" means actually usable — configured (env) AND toggled on
  // (DB) — not just the DB toggle, which can look "on" while being fully
  // inert if the env var for that method is off.
  const anySignInMethodLeft =
    (configuredFlags.google && settings.authEnableGoogle) ||
    (configuredFlags.emailPassword && settings.authEnableEmailPassword)

  const patch = async (body: Record<string, unknown>) => {
    const response = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || 'Failed to save settings')
  }

  // Switches save on change (optimistic, reverted if the server refuses).
  const saveToggle = async (key: ToggleKey, value: boolean) => {
    const previous = settings[key]
    clearTimeout(savedTimers.current[key])
    setSettings((s) => ({ ...s, [key]: value }))
    setRowState((r) => ({ ...r, [key]: 'saving' }))
    try {
      await patch({ [key]: value })
      setRowState((r) => ({ ...r, [key]: 'saved' }))
      savedTimers.current[key] = setTimeout(() => setRowState((r) => ({ ...r, [key]: undefined })), 2000)
      toast.success(`${LABELS[key]} updated`)
      router.refresh()
    } catch (error) {
      setSettings((s) => ({ ...s, [key]: previous }))
      setRowState((r) => ({ ...r, [key]: undefined }))
      toast.error(error instanceof Error ? error.message : 'Failed to save settings')
    }
  }

  const saveMaintenanceText = async () => {
    setIsSavingMaintenance(true)
    try {
      await patch({ maintenanceMessage: settings.maintenanceMessage, maintenanceExemptPaths: exemptPaths })
      toast.success('Maintenance settings saved')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setIsSavingMaintenance(false)
    }
  }

  return (
    <div className="space-y-6">
      <nav className="sticky top-0 z-10 -mx-1 flex flex-wrap gap-1 rounded-lg border bg-background/90 p-1 backdrop-blur" aria-label="Settings sections">
        {SECTIONS.map((sec) => (
          <a key={sec.id} href={`#${sec.id}`} className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
            {sec.label}
          </a>
        ))}
      </nav>

      <Card id="maintenance" className="scroll-mt-16">
        <CardHeader>
          <CardTitle>Maintenance Mode</CardTitle>
          <CardDescription>
            Blocks every page and API route except the paths kept open below, and shows a
            maintenance page instead — admins keep full access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            id="maintenance-toggle"
            label="Maintenance mode"
            description="Non-admins are redirected to /maintenance"
            badge={settings.maintenanceMode ? <Badge variant="destructive">Site locked</Badge> : <Badge variant="outline">Off</Badge>}
            checked={settings.maintenanceMode}
            state={rowState.maintenanceMode}
            onChange={(v) => saveToggle('maintenanceMode', v)}
          />

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
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setExemptPathsText(DEFAULT_MAINTENANCE_EXEMPT_PATHS.join('\n'))}
            >
              Reset to public pages
            </Button>
            <Button size="sm" onClick={saveMaintenanceText} disabled={isSavingMaintenance}>
              {isSavingMaintenance ? 'Saving...' : 'Save message & paths'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card id="auth" className="scroll-mt-16">
        <CardHeader>
          <CardTitle>Authentication & Sessions</CardTitle>
          <CardDescription>
            Live toggles on top of what&apos;s configured via environment variables —
            a method disabled here stops working immediately, without a redeploy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            id="google-toggle"
            label="Google sign-in"
            description="Show the Google button and accept sign-ins"
            {...envProps(controlStatus.authEnableGoogle, settings.authEnableGoogle)}
            checked={settings.authEnableGoogle}
            state={rowState.authEnableGoogle}
            onChange={(v) => saveToggle('authEnableGoogle', v)}
          />

          <SettingRow
            id="email-toggle"
            label="Email & password sign-in"
            description="Show the email/password form and signup page"
            {...envProps(controlStatus.authEnableEmailPassword, settings.authEnableEmailPassword)}
            checked={settings.authEnableEmailPassword}
            state={rowState.authEnableEmailPassword}
            onChange={(v) => saveToggle('authEnableEmailPassword', v)}
          />

          <SettingRow
            id="onetap-toggle"
            label="Google One Tap"
            description="Show the One Tap prompt on load — a shortcut into Google sign-in, not a separate method; it stops working if Google sign-in above is off"
            {...envProps(controlStatus.authEnableOneTap, settings.authEnableOneTap)}
            note={!settings.authEnableGoogle && (
              <p className="text-sm text-amber-600 dark:text-amber-500">
                Requires Google sign-in to be enabled above
              </p>
            )}
            checked={settings.authEnableOneTap}
            state={rowState.authEnableOneTap}
            onChange={(v) => saveToggle('authEnableOneTap', v)}
          />

          <SettingRow
            id="revoke-toggle"
            label="Session revocation"
            description="Let users revoke their own sessions from Settings"
            checked={settings.enableSessionRevocation}
            state={rowState.enableSessionRevocation}
            onChange={(v) => saveToggle('enableSessionRevocation', v)}
          />

          {!anySignInMethodLeft && (
            <p className="text-sm text-destructive">
              At least one sign-in method must stay enabled, or nobody will be able to sign in.
            </p>
          )}
        </CardContent>
      </Card>

      <Card id="privacy" className="scroll-mt-16">
        <CardHeader>
          <CardTitle>Privacy &amp; Consent</CardTitle>
          <CardDescription>
            Whether visitors must opt in before device fingerprinting and Google One Tap run
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            id="consent-toggle"
            label="Require consent (GDPR / ePrivacy)"
            description="On: cookie banner where visitors allow fingerprinting and One Tap separately, and the device record is erased if fingerprint consent is withdrawn. Off: no banner, everything runs for every visitor."
            note={!settings.consentRequired && (
              <p className="text-sm text-amber-600 dark:text-amber-500">
                Only turn this off if none of your users are in the EU, the UK or another region with
                consent rules. Fingerprinting without consent breaks those laws.
              </p>
            )}
            checked={settings.consentRequired ?? true}
            state={rowState.consentRequired}
            onChange={(v) => saveToggle('consentRequired', v)}
          />
        </CardContent>
      </Card>

      <Card id="diagnostics" className="scroll-mt-16">
        <CardHeader>
          <CardTitle>Integrations &amp; Diagnostics</CardTitle>
          <CardDescription>
            Feedback reporting (applies when FEEDBACK_DISCORD_WEBHOOK_URL or FEEDBACK_EMAIL is set) and developer test tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            id="feedback-errors-toggle"
            label="Attach error details"
            description="When a user reports a problem from an error, send the error message with their report, even if they edit it out of the text"
            {...envProps(controlStatus.feedbackAttachErrors, settings.feedbackAttachErrors)}
            checked={settings.feedbackAttachErrors}
            state={rowState.feedbackAttachErrors}
            onChange={(v) => saveToggle('feedbackAttachErrors', v)}
          />
          {process.env.NODE_ENV === "development" ? (
            <FeedbackTestForm />
          ) : (
            <p className="text-sm text-muted-foreground">Error-pipeline test tools are available in development builds.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
