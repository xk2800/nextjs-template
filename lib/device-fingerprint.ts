// Shared client-side device id (FingerprintJS visitorId), computed once and
// cached for the page's lifetime — the library's get() isn't cheap and the
// login form, signup form and deviceCheck.tsx all want the same value.
//
// @fingerprintjs/fingerprintjs is an optional peer dep: if it isn't installed
// (or is blocked in the browser), this resolves to null and callers carry on
// without a fingerprint.
let cached: Promise<string | null> | undefined

export function getVisitorId(): Promise<string | null> {
  cached ??= (async () => {
    try {
      const FingerprintJS = (await import("@fingerprintjs/fingerprintjs")).default
      const { visitorId } = await (await FingerprintJS.load()).get()
      return visitorId || null
    } catch {
      return null
    }
  })()
  return cached
}
