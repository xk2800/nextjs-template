import "server-only"
import { db } from "../../../server/db"
import { systemSettings } from "../../../server/db/schema"
import { config } from "../../../config/env"
import { eq } from "drizzle-orm"
import { DEFAULT_MAINTENANCE_EXEMPT_PATHS } from "../../config/maintenance"

const SETTINGS_ROW_ID = "default"
// Short TTL: cheap reads (no DB round trip on every request), while an
// admin's change is guaranteed live within this window even for a reader
// that isn't the one who just saved (invalidateSystemSettingsCache() makes
// it instant for that request's own process).
const CACHE_TTL_MS = 10_000

export type SystemSettings = typeof systemSettings.$inferSelect

let cached: { value: SystemSettings; expiresAt: number } | null = null

// Fail-open shape if the DB is unreachable: auth flags fall back to their
// config/env.ts defaults (unchanged behavior), maintenance mode is always
// off — a DB hiccup must never lock out the whole site, including admins.
function fallbackSettings(): SystemSettings {
  return {
    id: SETTINGS_ROW_ID,
    maintenanceMode: false,
    maintenanceMessage: null,
    maintenanceExemptPaths: DEFAULT_MAINTENANCE_EXEMPT_PATHS,
    authEnableGoogle: config.AUTH_ENABLE_GOOGLE,
    authEnableEmailPassword: config.AUTH_ENABLE_EMAIL_PASSWORD,
    authEnableOneTap: config.AUTH_ENABLE_ONE_TAP,
    enableSessionRevocation: config.ENABLE_SESSION_REVOCATION,
    feedbackAttachErrors: true,
    consentRequired: null,
    updatedAt: new Date(0),
    updatedBy: null,
  }
}

async function loadOrSeed(): Promise<SystemSettings> {
  const existing = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.id, SETTINGS_ROW_ID))
    .limit(1)
  if (existing[0]) return existing[0]

  // Lazy-seed on first read, from the *current* env config — not the
  // schema's hardcoded column defaults — so turning this feature on never
  // silently flips an already-deployed flag (e.g. a prod deploy that
  // already set AUTH_ENABLE_GOOGLE=false).
  const seeded = await db
    .insert(systemSettings)
    .values({
      id: SETTINGS_ROW_ID,
      maintenanceMode: false,
      authEnableGoogle: config.AUTH_ENABLE_GOOGLE,
      authEnableEmailPassword: config.AUTH_ENABLE_EMAIL_PASSWORD,
      authEnableOneTap: config.AUTH_ENABLE_ONE_TAP,
      enableSessionRevocation: config.ENABLE_SESSION_REVOCATION,
    })
    .onConflictDoNothing()
    .returning()

  if (seeded[0]) return seeded[0]

  // Lost the seed race to a concurrent first-reader.
  const retry = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.id, SETTINGS_ROW_ID))
    .limit(1)
  return retry[0] ?? fallbackSettings()
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const now = Date.now()
  if (cached && cached.expiresAt > now) return cached.value

  try {
    const value = await loadOrSeed()
    cached = { value, expiresAt: now + CACHE_TTL_MS }
    return value
  } catch (error) {
    console.error("Failed to load system settings, failing open:", error)
    return fallbackSettings() // not cached — retry next request
  }
}

export function invalidateSystemSettingsCache() {
  cached = null
}

export type SystemSettingsPatch = Partial<Pick<SystemSettings,
  | 'maintenanceMode' | 'maintenanceMessage' | 'maintenanceExemptPaths'
  | 'authEnableGoogle' | 'authEnableEmailPassword' | 'authEnableOneTap'
  | 'enableSessionRevocation' | 'feedbackAttachErrors' | 'consentRequired'
>>

export async function updateSystemSettings(
  patch: SystemSettingsPatch,
  updatedBy: string
): Promise<SystemSettings> {
  await loadOrSeed() // ensure the row exists even if nobody's read it yet

  const [updated] = await db
    .update(systemSettings)
    .set({ ...patch, updatedAt: new Date(), updatedBy })
    .where(eq(systemSettings.id, SETTINGS_ROW_ID))
    .returning()

  invalidateSystemSettingsCache()
  return updated
}

// Effective auth-method visibility = deploy-time "configured" (env, decides
// whether the provider is even registered with better-auth — see
// server/auth.ts's createAuth()) AND runtime "offered" (this DB flag).
export async function getEffectiveAuthFlags() {
  const settings = await getSystemSettings()
  return {
    google: config.AUTH_ENABLE_GOOGLE && settings.authEnableGoogle,
    emailPassword: config.AUTH_ENABLE_EMAIL_PASSWORD && settings.authEnableEmailPassword,
    oneTap: config.AUTH_ENABLE_ONE_TAP && settings.authEnableOneTap,
  }
}

// Consent mode: the admin's choice if they've made one, else the
// NEXT_PUBLIC_COOKIE_BANNER default (banner on unless it's "false").
export function isConsentRequired(settings: Pick<SystemSettings, 'consentRequired'>): boolean {
  return settings.consentRequired ?? process.env.NEXT_PUBLIC_COOKIE_BANNER !== "false"
}

// What each admin-settings control needs from the environment before its
// toggle can do anything. Add an entry here when you add a control that depends
// on env vars; the System Settings page then shows it disabled, with a badge and
// the reason, until the deployment provides them. Controls with no entry
// are always usable.
//   flag: an AUTH_ENABLE_*-style switch that must be on
//   keys: every group must be satisfied; within a group any one variable is enough
//         (aliases, or "this or that"). The first name in a group is the one shown.
// Read lazily so NEXT_PUBLIC_* / env values are looked at when the page renders.
type Requirement = { flag?: [name: string, on: boolean]; keys?: string[][] }

const CONTROL_REQUIREMENTS: Record<string, () => Requirement> = {
  authEnableGoogle: () => ({
    flag: ["AUTH_ENABLE_GOOGLE", config.AUTH_ENABLE_GOOGLE],
    keys: [["AUTH_GOOGLE_ID", "GOOGLE_CLIENT_ID"], ["AUTH_GOOGLE_SECRET", "GOOGLE_CLIENT_SECRET"]],
  }),
  authEnableEmailPassword: () => ({
    flag: ["AUTH_ENABLE_EMAIL_PASSWORD", config.AUTH_ENABLE_EMAIL_PASSWORD],
  }),
  authEnableOneTap: () => ({
    flag: ["AUTH_ENABLE_ONE_TAP", config.AUTH_ENABLE_ONE_TAP],
    keys: [["NEXT_PUBLIC_GOOGLE_CLIENT_ID"], ["NEXT_PUBLIC_AUTH_ENABLE_ONE_TAP=true"]],
  }),
  // The toggle only matters once feedback has somewhere to go.
  feedbackAttachErrors: () => ({
    keys: [["FEEDBACK_DISCORD_WEBHOOK_URL", "FEEDBACK_EMAIL"]],
  }),
}

export type ControlStatus =
  | { ok: true }
  | { ok: false; kind: "flag" | "keys"; reason: string }

export function getControlStatuses(): Record<string, ControlStatus> {
  const isSet = (name: string) =>
    name.includes("=") ? process.env[name.split("=")[0]] === name.split("=")[1] : Boolean(process.env[name])
  const out: Record<string, ControlStatus> = {}
  for (const [key, build] of Object.entries(CONTROL_REQUIREMENTS)) {
    const req = build()
    if (req.flag && !req.flag[1]) {
      out[key] = { ok: false, kind: "flag", reason: `Not configured for this deployment. Set ${req.flag[0]}=true to unlock this toggle.` }
      continue
    }
    const missing = (req.keys ?? []).filter((group) => !group.some(isSet)).map((group) => group.join(" or "))
    out[key] = missing.length
      ? {
          ok: false,
          kind: "keys",
          reason: `Missing environment variable${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. Add ${missing.length > 1 ? "them" : "it"} and redeploy to unlock this toggle (NEXT_PUBLIC_ values need a rebuild).`,
        }
      : { ok: true }
  }
  return out
}

export function getConfiguredAuthFlags() {
  return {
    google: config.AUTH_ENABLE_GOOGLE,
    emailPassword: config.AUTH_ENABLE_EMAIL_PASSWORD,
    oneTap: config.AUTH_ENABLE_ONE_TAP,
  }
}
