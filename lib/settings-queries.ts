import "server-only"
import { db } from "../server/db"
import { systemSettings } from "../server/db/schema"
import { config } from "../config/env"
import { eq } from "drizzle-orm"

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
    authEnableGoogle: config.AUTH_ENABLE_GOOGLE,
    authEnableEmailPassword: config.AUTH_ENABLE_EMAIL_PASSWORD,
    authEnableOneTap: config.AUTH_ENABLE_ONE_TAP,
    enableSessionRevocation: config.ENABLE_SESSION_REVOCATION,
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
  | 'maintenanceMode' | 'maintenanceMessage'
  | 'authEnableGoogle' | 'authEnableEmailPassword' | 'authEnableOneTap'
  | 'enableSessionRevocation'
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

// The env-only half of the AND above. The System Settings page needs this
// to explain *why* a toggle it controls isn't taking effect — flipping the
// DB flag on can't do anything if the env var for that method is off, so
// the UI should say so instead of looking like a silent no-op.
export function getConfiguredAuthFlags() {
  return {
    google: config.AUTH_ENABLE_GOOGLE,
    emailPassword: config.AUTH_ENABLE_EMAIL_PASSWORD,
    oneTap: config.AUTH_ENABLE_ONE_TAP,
  }
}
