// The one place the site's base URL is decided (auth callbacks, passkey
// origin, email links, redirect guard). BETTER_AUTH_URL wins because that's
// the variable the setup docs, doctor and scaffolder fill in; the others are
// legacy/fallback. No server-only imports, so tests can use it.
export function getBaseUrl(): string {
  const url =
    process.env.BETTER_AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  return url.replace(/\/+$/, "")
}
