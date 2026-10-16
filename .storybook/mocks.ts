import { createContext, useContext } from "react"

// Storybook stand-ins for every DB / auth module the components touch.
// .storybook/main.ts aliases those imports here, so stories render with this
// fixture data and never need a database or a running auth server.

const now = Date.now()
const ago = (mins: number) => new Date(now - mins * 60_000)
const inDays = (days: number) => new Date(now + days * 86_400_000)

const MAC_CHROME = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"

// ---------- fixtures ----------

export const mockUser = {
  id: "usr_1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  emailVerified: true,
  image: null as string | null,
  role: "admin",
  twoFactorEnabled: false,
  banned: false,
  bannedAt: null as Date | null,
  bannedReason: null as string | null,
  lastLoginAt: ago(5),
  lastActiveAt: ago(1),
  createdAt: ago(60 * 24 * 90),
  updatedAt: ago(60 * 24),
}

export const mockUsers = [
  mockUser,
  { ...mockUser, id: "usr_2", name: "Grace Hopper", email: "grace@example.com", role: "user", lastLoginAt: ago(120), createdAt: ago(60 * 24 * 3) },
  { ...mockUser, id: "usr_3", name: "Alan Turing", email: "alan@example.com", role: "user", banned: true, bannedAt: ago(60 * 24), bannedReason: "Spam", lastLoginAt: ago(60 * 48) },
  { ...mockUser, id: "usr_4", name: null, email: "anon@example.com", role: "user", emailVerified: false, lastLoginAt: null, lastActiveAt: null },
]

export const mockSessions = [
  { id: "ses_1", token: "current-token", userId: mockUser.id, createdAt: ago(5), updatedAt: ago(5), expiresAt: inDays(30), ipAddress: "81.2.69.160", userAgent: MAC_CHROME, impersonatedBy: null, deviceLabel: "Chrome on macOS · Desktop", location: "London, United Kingdom" },
  { id: "ses_2", token: "other-token", userId: mockUser.id, createdAt: ago(60 * 26), updatedAt: ago(60), expiresAt: inDays(29), ipAddress: "8.8.8.8", userAgent: IPHONE, impersonatedBy: null, deviceLabel: "Mobile Safari on iOS 18.0 · Mobile", location: "Mountain View, United States" },
]

const log = (id: string, action: string, description: string, mins: number, user = mockUsers[id.length % 3]) => ({
  id,
  action,
  description,
  ipAddress: "81.2.69.160",
  userAgent: MAC_CHROME,
  metadata: JSON.stringify({ referrerUrl: "https://google.com/" }),
  createdAt: ago(mins),
  userId: user.id,
  userName: user.name,
  userEmail: user.email,
  deviceLabel: "Chrome on macOS · Desktop",
  location: "London, United Kingdom",
})

export const mockActivityLogs = [
  log("log_1", "login", "User signed in", 5),
  log("log_2", "password_changed", "Password changed", 60),
  log("log_3", "login_failed", "Failed sign-in attempt", 90),
  log("log_4", "impersonation_started", "Ada impersonated Grace", 180),
  log("log_5", "settings_changed", "Maintenance mode enabled", 600),
  log("log_6", "user_banned", "Alan was banned", 60 * 24),
  log("log_7", "logout", "User signed out", 60 * 30),
]

export const mockLoginHistory = [
  { id: "l1", description: "User signed in", referrerUrl: "https://google.com/", os: "macOS 10.15.7", browser: "Chrome", deviceType: "desktop", country: "United Kingdom", city: "London", ipAddress: "81.2.69.160", createdAt: ago(5) },
  { id: "l2", description: "User registered", referrerUrl: null, os: "iOS 18.0", browser: "Mobile Safari", deviceType: "mobile", country: "United States", city: "Mountain View", ipAddress: "8.8.8.8", createdAt: ago(60 * 24 * 90) },
]

export const mockImpersonationEvents = [
  { id: "imp_1", action: "impersonation_started", description: "Started impersonating grace@example.com", createdAt: ago(180), adminId: mockUser.id, adminName: mockUser.name, adminEmail: mockUser.email },
  { id: "imp_2", action: "impersonation_stopped", description: "Stopped impersonating grace@example.com", createdAt: ago(170), adminId: mockUser.id, adminName: mockUser.name, adminEmail: mockUser.email },
]

export const mockThrottleRows = [
  { fingerprint: "fp_9f2c1a7b3e", count: 12, windowStart: ago(4), lastAttemptAt: ago(1), ipAddress: "203.0.113.7", userAgent: MAC_CHROME, lastEmail: "grace@example.com", lastKind: "signin", os: "macOS 10.15.7", browser: "Chrome", deviceType: "desktop" as const, country: "Germany", city: "Berlin", blocked: true, windowActive: true },
  { fingerprint: "fp_51d0e88c42", count: 6, windowStart: ago(20), lastAttemptAt: ago(9), ipAddress: "198.51.100.23", userAgent: IPHONE, lastEmail: "new@example.com", lastKind: "signup", os: "iOS 18.0", browser: "Mobile Safari", deviceType: "mobile" as const, country: null, city: null, blocked: false, windowActive: true },
  { fingerprint: "fp_c73a10fe6d", count: 5, windowStart: ago(600), lastAttemptAt: ago(590), ipAddress: null, userAgent: null, lastEmail: null, lastKind: "signin", os: null, browser: null, deviceType: "desktop" as const, country: null, city: null, blocked: false, windowActive: false },
]

export const mockNewDevices = [
  { id: "nd_1", userId: "usr_2", userName: "Grace Hopper", userEmail: "grace@example.com", ipAddress: "8.8.8.8", userAgent: IPHONE, country: "United States", city: "Mountain View", createdAt: ago(30), os: "iOS 18.0", browser: "Mobile Safari", deviceType: "mobile" as const },
  { id: "nd_2", userId: "usr_1", userName: "Ada Lovelace", userEmail: "ada@example.com", ipAddress: "81.2.69.160", userAgent: MAC_CHROME, country: "United Kingdom", city: "London", createdAt: ago(60 * 5), os: "macOS 10.15.7", browser: "Chrome", deviceType: "desktop" as const },
]

export const mockSharedDevices = [
  {
    visitorId: "fp_shared_01",
    accountCount: 3,
    lastSeenAt: ago(45),
    country: "Germany",
    city: "Berlin",
    userAgent: MAC_CHROME,
    os: "macOS 10.15.7",
    browser: "Chrome",
    deviceType: "desktop" as const,
    accounts: mockUsers.slice(0, 3).map((u) => ({ userId: u.id, userName: u.name ?? "", userEmail: u.email, banned: u.banned, firstSeenAt: u.createdAt })),
  },
]

export const mockSettings = {
  id: "default",
  maintenanceMode: false,
  maintenanceMessage: null as string | null,
  maintenanceExemptPaths: ["/api/health"],
  authEnableGoogle: true,
  authEnableEmailPassword: true,
  authEnableOneTap: false,
  enableSessionRevocation: true,
  updatedAt: ago(60),
  updatedBy: null as string | null,
}

export const mockPasskeys = [
  { id: "pk_1", name: "MacBook Touch ID", deviceType: "singleDevice", createdAt: ago(60 * 24 * 10) },
  { id: "pk_2", name: "iPhone", deviceType: "multiDevice", createdAt: ago(60 * 24 * 2) },
]

// ---------- session (lib/auth-client + server/auth) ----------

export type MockSession = { user: typeof mockUser; session: (typeof mockSessions)[number] } | null

export const defaultSession: MockSession = { user: mockUser, session: mockSessions[0] }

// Hooks read the session from context, so every story on a Docs page keeps its own.
// Non-hook callers (authClient.getSession, server auth.api) read the module copy.
export const MockSessionContext = createContext<MockSession>(defaultSession)
let currentSession: MockSession = defaultSession

/** Called by the preview decorator from a story's `parameters.session`. */
export function setMockSession(session: MockSession) {
  currentSession = session
}

export function useSession() {
  return { data: useContext(MockSessionContext), isPending: false, error: null, refetch: async () => {} }
}

// Canned responses by call path; anything else resolves to { data: null, error: null }.
const responses: Record<string, () => unknown> = {
  getSession: () => currentSession,
  listAccounts: () => [{ providerId: "credential" }],
  "passkey.listUserPasskeys": () => mockPasskeys,
}

function client(path: string[] = []): any {
  return new Proxy(() => {}, {
    get: (_, key) => (key === "then" ? undefined : client([...path, String(key)])),
    apply: async (_, __, args) => {
      const name = path.join(".")
      console.info(`[storybook] authClient.${name}`, ...args)
      await new Promise((r) => setTimeout(r, 400))
      return { data: responses[name]?.() ?? null, error: null }
    },
  })
}

export const authClient = client()
export const { signIn, signOut, signUp } = authClient

export const auth = { api: { getSession: async () => currentSession } }

// ---------- lib/request-info (real one is server-only + geoip) ----------

export const parseUserAgent = (ua: string | null | undefined) =>
  ua?.includes("iPhone")
    ? { os: "iOS 18.0", browser: "Mobile Safari", deviceType: "mobile" as const }
    : { os: ua ? "macOS 10.15.7" : null, browser: ua ? "Chrome" : null, deviceType: "desktop" as const }

export const lookupGeoLocation = (ip: string | null | undefined) =>
  ip ? { country: "United Kingdom", city: "London" } : { country: null, city: null }

export function formatDeviceInfo({ os, browser, deviceType }: { os: string | null; browser: string | null; deviceType: string }) {
  const label = [browser, os].filter(Boolean).join(" on ")
  const type = deviceType === "mobile" ? "Mobile" : deviceType === "tablet" ? "Tablet" : "Desktop"
  return label ? `${label} · ${type}` : `Unknown device · ${type}`
}

export const formatLocation = ({ country, city }: { country: string | null; city: string | null }) =>
  !country && !city ? "Unknown" : [city, country].filter(Boolean).join(", ")

// ---------- *-queries ----------

const page = <T,>(rows: T[], limit: number) => ({ total: rows.length, page: 1, limit, pages: Math.ceil(rows.length / limit) })

export const getUserActivityLogs = async () => mockActivityLogs
export const getAllActivityLogs = async () => mockActivityLogs
export const getRecentImpersonationEvents = async () => mockImpersonationEvents
export const getActivityLogsFiltered = async ({ limit = 20 } = {}) => ({ logs: mockActivityLogs, ...page(mockActivityLogs, limit) })
export const getUsersFiltered = async ({ limit = 10 } = {}) => ({ users: mockUsers, ...page(mockUsers, limit) })
export const getUserSessions = async () => mockSessions
export const getSystemSettings = async () => mockSettings
export const getConfiguredAuthFlags = () => ({ google: true, emailPassword: true, oneTap: false })
export const getAdminDashboardStats = async () => ({ totalUsers: 1284, newSignupsThisWeek: 37, activeSessions: 212, bannedCount: 4 })
export const getDeviceThrottleActivity = async () => mockThrottleRows
export const getRecentNewDevices = async () => mockNewDevices
export const getSharedDeviceAccounts = async () => mockSharedDevices
