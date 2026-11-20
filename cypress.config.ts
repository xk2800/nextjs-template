import { createHmac } from "node:crypto"
import { defineConfig } from "cypress"
import { Client } from "pg"

// Same DB the dev server uses; the tasks below read tokens and flip flags
// that the UI would otherwise need an inbox, an authenticator app or an admin for.
try {
  process.loadEnvFile(".env.development")
} catch {}

async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  try {
    return (await client.query(sql, params)).rows as T[]
  } finally {
    await client.end()
  }
}

// RFC 6238 TOTP (SHA-1, 30s, 6 digits), what authenticator apps compute from the otpauth:// secret.
function totp(base32Secret: string, now = Date.now()): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  let bits = ""
  for (const c of base32Secret.replace(/=+$/, "").toUpperCase()) {
    bits += alphabet.indexOf(c).toString(2).padStart(5, "0")
  }
  const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)))
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(Math.floor(now / 30000)))
  const hmac = createHmac("sha1", key).update(counter).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  return String((hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, "0")
}

export default defineConfig({
  projectId: '4z8pph',
  // Lets specs mark the "What's New" modal as seen for the version the app shows.
  expose: { APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION },
  e2e: {
    // Matches PORT/BASE_URL in .env.development; override with CYPRESS_BASE_URL.
    baseUrl: "http://localhost:3001",
    supportFile: false,
    video: false,
    setupNodeEvents(on) {
      on("task", {
        totp: (secret: string) => totp(secret),

        // better-auth stores the emailed reset token as `reset-password:<token>` → user id.
        async resetToken(email: string) {
          const [row] = await query<{ identifier: string }>(
            `select v.identifier from verification v join "user" u on v.value = u.id
             where u.email = $1 and v.identifier like 'reset-password:%'
             order by v."createdAt" desc limit 1`,
            [email],
          )
          return row ? row.identifier.slice("reset-password:".length) : null
        },

        async banUser(email: string) {
          await query(`update "user" set banned = true, "bannedAt" = now(), "bannedReason" = 'cypress' where email = $1`, [email])
          return null
        },

        // Drops the sign-in throttle counters these tests create (loopback IP + test fingerprints).
        async clearThrottle() {
          await query(
            `delete from auth_throttle where fingerprint like 'cypress-%'
             or fingerprint in ('ip:127.0.0.1', 'ip:::1', 'ip:::ffff:127.0.0.1')`,
          )
          return null
        },
      })
    },
  },
})
