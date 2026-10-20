import { boolean, check, index, integer, jsonb, pgEnum, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createId } from '@paralleldrive/cuid2'
import { DEFAULT_MAINTENANCE_EXEMPT_PATHS } from "../../lib/maintenance";

// 'tester' is a regular user account flagged for testing; apps can use it to
// keep test accounts apart from real users. It has no admin access.
export const RoleEnum = pgEnum('roles', ['user', 'admin', 'tester'])

export const ActivityActionEnum = pgEnum('activity_actions', [
  'login',
  'logout',
  'login_failed',
  'password_changed',
  'email_changed',
  'profile_updated',
  'session_revoked',
  'user_deleted',
  'user_banned',
  'user_unbanned',
  'role_changed',
  'impersonation_started',
  'impersonation_stopped',
  'settings_changed',
  'passkey_added',
  'passkey_removed',
])

export const users = pgTable("user", {
  id: text("id").notNull().primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password'),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  role: RoleEnum('roles').default('user').notNull(),
  banned: boolean('banned').default(false).notNull(),
  bannedAt: timestamp('bannedAt'),
  bannedReason: text('bannedReason'),
  // Required by better-auth's admin plugin schema (auto-expiring bans). We
  // never set this ourselves, so it stays null and bans behave as permanent,
  // same as before the plugin was added.
  banExpires: timestamp('banExpires'),
  lastLoginAt: timestamp('lastLoginAt'),
  lastActiveAt: timestamp('lastActiveAt'),
  // Set by better-auth's twoFactor plugin — true once the user has
  // completed TOTP setup (see twoFactor pgTable below for the secret /
  // backup codes themselves).
  twoFactorEnabled: boolean('twoFactorEnabled').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const sessions = pgTable("session", {
  id: text("id").notNull().primaryKey().$defaultFn(() => createId()),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // Set by better-auth's admin plugin while this session is an admin
  // impersonating another user; holds the impersonating admin's user id.
  impersonatedBy: text("impersonatedBy"),
});

export const accounts = pgTable("account", {
  id: text("id").notNull().primaryKey().$defaultFn(() => createId()),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Better-auth's twoFactor plugin. One row per user (created on first
// `enable`); secret and backupCodes are its own encrypted-at-rest strings,
// field names/types must match its expectations exactly (drizzleAdapter in
// server/auth.ts maps this table to the plugin's "twoFactor" model as-is).
export const twoFactors = pgTable("twoFactor", {
  id: text("id").notNull().primaryKey().$defaultFn(() => createId()),
  secret: text("secret").notNull(),
  backupCodes: text("backupCodes").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // Added in better-auth 1.7 (TOTP lockout). Defaults match the plugin's.
  verified: boolean("verified").default(true),
  failedVerificationCount: integer("failedVerificationCount").default(0),
  lockedUntil: timestamp("lockedUntil"),
});

// Better-auth's passkey plugin — one row per registered WebAuthn credential.
export const passkeys = pgTable("passkey", {
  id: text("id").notNull().primaryKey().$defaultFn(() => createId()),
  name: text("name"),
  publicKey: text("publicKey").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  credentialID: text("credentialID").notNull().unique(),
  counter: integer("counter").notNull(),
  deviceType: text("deviceType").notNull(),
  backedUp: boolean("backedUp").notNull(),
  transports: text("transports"),
  createdAt: timestamp("createdAt"),
  aaguid: text("aaguid"),
});

export const verifications = pgTable("verification", {
  id: text("id").notNull().primaryKey().$defaultFn(() => createId()),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const activityLogs = pgTable("activity_log", {
  id: text("id").notNull().primaryKey().$defaultFn(() => createId()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  action: ActivityActionEnum('action').notNull(),
  description: text('description').notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  metadata: text('metadata'),
  // Populated on 'login' events only (registration + sign-in) — parsed from
  // userAgent/ipAddress at write time so the record stays stable even if
  // the parsing library or geoip database changes later.
  referrerUrl: text('referrerUrl'),
  os: text('os'),
  browser: text('browser'),
  deviceType: text('deviceType'),
  country: text('country'),
  city: text('city'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

// One row per (user, device fingerprint) pair. Its only job is to answer
// "has this account signed in from this device before?" — no matching row ⇒
// send a new-device alert (see app/api/device-check/route.ts). visitorId is
// FingerprintJS's identifier, computed client-side in
// components/auth/deviceCheck.tsx. UA+IP are deliberately NOT the signal here:
// they churn constantly on mobile and would alert on every other login.
export const deviceFingerprints = pgTable("device_fingerprint", {
  id: text("id").notNull().primaryKey().$defaultFn(() => createId()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  visitorId: text("visitorId").notNull(),
  // Context captured at first-seen time — for the admin panel's "New devices"
  // card and the alert email. Not part of the new-vs-known decision (that's
  // visitorId only), just so an admin can eyeball whether a sign-in looks like
  // a hijack. Nullable: an old row predates these columns, or geoip missed.
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  country: text("country"),
  city: text("city"),
  // Latest FingerprintJS signals for this device (lib/device-fingerprint.ts
  // getDeviceSignals(): accessibility signals dropped, large values hashed),
  // shown on the admin user page. Null for rows from before this column.
  components: jsonb("components").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, (table) => [
  unique("device_fingerprint_user_visitor").on(table.userId, table.visitorId),
]);

// Per-device abuse throttle for /sign-in/email and /sign-up/email — one
// fixed-window counter row per FingerprintJS visitorId (sent by the auth
// forms as the x-device-fingerprint header; see lib/auth-throttle.ts).
// Keyed by device, not IP: IP is shared behind corporate NAT / CGNAT / VPN,
// so an IP counter throttles coworkers together while missing an abuser who
// rotates IPs. Rows untouched for 30 days are deleted (RETENTION_MS in
// lib/auth-throttle-limits.ts, swept by lib/auth-throttle.ts).
export const authThrottle = pgTable("auth_throttle", {
  fingerprint: text("fingerprint").notNull().primaryKey(),
  count: integer("count").notNull().default(0),
  windowStart: timestamp("windowStart").notNull().defaultNow(),
  // Blockable data points, overwritten on every attempt (last-write-wins) so
  // the admin panel can show who to block — by IP or by fingerprint — with no
  // join and no per-attempt history table. windowStart anchors the counter's
  // window; lastAttemptAt is just "most recently seen".
  lastAttemptAt: timestamp("lastAttemptAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  lastEmail: text("lastEmail"),
  lastKind: text("lastKind"), // 'signin' | 'signup'
});

// Singleton row (id is always 'default') holding admin-editable settings for
// config that used to be env-var-only. See lib/settings-queries.ts for the
// cached read path and lazy-seed-from-env behavior.
export const systemSettings = pgTable("system_settings", {
  id: text("id").primaryKey().default("default"),
  maintenanceMode: boolean("maintenanceMode").notNull().default(false),
  maintenanceMessage: text("maintenanceMessage"),
  // Path prefixes that stay reachable while maintenance mode is on (see
  // lib/maintenance.ts — a few auth paths are always open on top of these).
  maintenanceExemptPaths: text("maintenanceExemptPaths").array().notNull().default(DEFAULT_MAINTENANCE_EXEMPT_PATHS),
  authEnableGoogle: boolean("authEnableGoogle").notNull().default(true),
  authEnableEmailPassword: boolean("authEnableEmailPassword").notNull().default(true),
  authEnableOneTap: boolean("authEnableOneTap").notNull().default(false),
  enableSessionRevocation: boolean("enableSessionRevocation").notNull().default(true),
  // Attach the error a user hit to feedback they send from it (see
  // lib/feedback-route.ts). Off = only what the user typed is sent.
  feedbackAttachErrors: boolean("feedbackAttachErrors").notNull().default(true),
  // GDPR/ePrivacy consent mode. On: cookie banner, FingerprintJS and One Tap
  // only after "Accept all", device record erased on withdrawal. Off (no EU/UK
  // users): no banner, treated as consented. Null = follow
  // NEXT_PUBLIC_COOKIE_BANNER (nullable so migrating never flips a deployed
  // banner on or off). proxy.ts mirrors the effective value into the
  // consent_required cookie for the client (lib/cookie-consent.ts).
  consentRequired: boolean("consentRequired"),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  // Who last changed a setting. This row doesn't "belong" to that admin the
  // way sessions/activityLogs belong to their user, so deleting that admin's
  // account should null this out rather than cascade-delete the singleton row.
  updatedBy: text("updatedBy").references(() => users.id, { onDelete: "set null" }),
}, (table) => [
  check("system_settings_singleton", sql`${table.id} = 'default'`),
]);
// Technical detail of unexpected errors, keyed by the short ref the user sees
// ("... (ref: K7Q2PX)", see lib/errors.ts). Never sent to the browser: the
// feedback route looks a ref up and attaches the detail to the report it
// sends to Discord/email. Rows older than 30 days are pruned on insert.
export const errorRefs = pgTable("error_refs", {
  ref: text("ref").primaryKey(),
  message: text("message").notNull(),
  detail: text("detail").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, (table) => [
  index("error_refs_created_at_idx").on(table.createdAt),
]);
