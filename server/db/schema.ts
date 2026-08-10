import { boolean, check, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createId } from '@paralleldrive/cuid2'

export const RoleEnum = pgEnum('roles', ['user', 'admin'])

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

// Singleton row (id is always 'default') holding admin-editable settings for
// config that used to be env-var-only. See lib/settings-queries.ts for the
// cached read path and lazy-seed-from-env behavior.
export const systemSettings = pgTable("system_settings", {
  id: text("id").primaryKey().default("default"),
  maintenanceMode: boolean("maintenanceMode").notNull().default(false),
  maintenanceMessage: text("maintenanceMessage"),
  authEnableGoogle: boolean("authEnableGoogle").notNull().default(true),
  authEnableEmailPassword: boolean("authEnableEmailPassword").notNull().default(true),
  authEnableOneTap: boolean("authEnableOneTap").notNull().default(false),
  enableSessionRevocation: boolean("enableSessionRevocation").notNull().default(true),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  // Who last changed a setting. This row doesn't "belong" to that admin the
  // way sessions/activityLogs belong to their user, so deleting that admin's
  // account should null this out rather than cascade-delete the singleton row.
  updatedBy: text("updatedBy").references(() => users.id, { onDelete: "set null" }),
}, (table) => [
  check("system_settings_singleton", sql`${table.id} = 'default'`),
]);