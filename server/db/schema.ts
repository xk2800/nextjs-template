import { boolean, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
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
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});