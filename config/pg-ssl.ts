// TLS options for the pg driver when DATABASE_SSL=true. Reads process.env
// directly (not config/env) so the doctor script and apps whose local
// env-schema predates these keys behave the same.
//
// Default: verify the server certificate (blocks a man-in-the-middle).
// - DATABASE_SSL_CA: PEM of the CA that signed the server cert (use "\n" for
//   newlines in a single-line env var), for self-signed or provider-private CAs.
// - DATABASE_SSL_INSECURE=true: encrypt only, don't verify. Last resort.
export function pgSslOptions() {
  if (process.env.DATABASE_SSL_INSECURE === "true") return { rejectUnauthorized: false }
  const ca = process.env.DATABASE_SSL_CA?.replace(/\\n/g, "\n")
  return { rejectUnauthorized: true, ...(ca ? { ca } : {}) }
}
