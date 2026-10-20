import { SiteHeader } from "@/components/site/site-header"
import { SiteFooter } from "@/components/site/site-footer"
import { getSystemSettings, isConsentRequired } from "@/lib/settings-queries"

export const metadata = {
  title: "Privacy Policy — nextjs-template",
}

// The cookie section depends on the admin's live "Require consent" setting,
// so never prerender a stale snapshot (same reason as app/maintenance).
export const dynamic = 'force-dynamic'

export default async function PrivacyPage() {
  const consentRequired = isConsentRequired(await getSystemSettings())

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-4 rounded-lg border border-dashed border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
          This is placeholder content shipped with the template — it is not a real privacy policy.
          Replace this page with one that accurately describes what your deployment actually collects,
          ideally reviewed by a lawyer.
        </p>

        <div className="mt-10 flex flex-col gap-8 text-sm text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground">What this template collects by default</h2>
            <p className="mt-2">
              Account details you provide (name, email, password or OAuth identity), and — for every
              sign-in — device, browser, approximate location, IP address and referrer, used for the
              audit log under Admin → Activity Logs. See <code className="font-mono">lib/request-info.ts</code>.
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">Device fingerprint.</span> A device
              identifier (FingerprintJS) computed in your browser from browser and device
              characteristics: platform, screen size, installed fonts, languages, time zone, CPU,
              memory, graphics (WebGL) and similar details. Large values such as canvas drawings are
              stored only as a hash. Accessibility settings (such as reduced motion or high contrast)
              are never collected. It&apos;s used to:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>email you, and the site&apos;s administrators, when your account signs in from a device it hasn&apos;t used before;</li>
              <li>limit repeated failed sign-in and sign-up attempts from one device;</li>
              <li>spot one device being used to create many accounts, which administrators may act on;</li>
              <li>let administrators review the devices your account signs in from, with these characteristics.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Cookies and similar technologies</h2>
            <p className="mt-2">
              <span className="font-medium text-foreground">Always on (necessary):</span> sign-in
              session cookies, a 5-minute cookie remembering which page a sign-in started from, a
              cookie recording whether this site asks for consent, sidebar and theme preferences, and
              short-lived browser storage for sign-in retries and &quot;what&apos;s new&quot; notices.
            </p>
            {consentRequired ? (
              <>
                <p className="mt-2">
                  <span className="font-medium text-foreground">Only if you accept optional cookies:</span>{" "}
                  the device fingerprint described above, and Google One Tap sign-in, which loads a
                  Google script that may set Google&apos;s own cookies. Your choice is stored in a
                  cookie for one year. If you decline, failed sign-ins are limited by IP address instead
                  and no device record is kept.
                </p>
                <p className="mt-2">
                  You can change your choice at any time via &quot;Cookie settings&quot; in the footer.
                  While optional cookies are accepted, the device identifier is also kept in your
                  browser&apos;s local storage. Switching to &quot;Necessary only&quot; deletes it, and
                  deletes the record of this device stored with your account (immediately if you&apos;re
                  signed in, otherwise at your next sign-in).
                </p>
              </>
            ) : (
              <p className="mt-2">
                <span className="font-medium text-foreground">Device fingerprint and Google One Tap:</span>{" "}
                this site doesn&apos;t ask for cookie consent, so the device fingerprint described above
                is computed for every visitor, and its identifier is kept in your browser&apos;s local
                storage. Google One Tap, if enabled, loads a Google script that may set Google&apos;s own
                cookies.
              </p>
            )}
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Legal basis</h2>
            <p className="mt-2">
              {consentRequired
                ? "Your consent for the device fingerprint and Google One Tap; the performance of our contract with you for your account; and our legitimate interest in keeping accounts secure for sign-in logs and the failed-sign-in limit."
                : "The performance of our contract with you for your account, and our legitimate interest in keeping accounts secure and preventing abuse for sign-in logs and the device fingerprint."}
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">How long it&apos;s kept</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Account details, sign-in logs and device records: until your account is deleted.{consentRequired && " Device records are also deleted when you withdraw cookie consent."}</li>
              <li>Failed sign-in counters (device identifier, IP address, browser and the last email entered): 30 days after the last attempt.</li>
              <li>Sessions: up to 30 days, or until you sign out or revoke them.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Where it&apos;s stored and who receives it</h2>
            <p className="mt-2">
              In your own Postgres database, via the schema in{" "}
              <code className="font-mono">server/db/schema.ts</code>. The device fingerprint is computed
              locally in your browser and isn&apos;t sent to FingerprintJS. When enabled, these
              services receive data to do their job: an email provider (Resend) receives your email
              address and the content of account emails, such as new-device alerts with the
              device, approximate location and IP address; Google receives sign-in requests if you use
              Google sign-in or One Tap.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Your rights</h2>
            <p className="mt-2">
              You can delete your account yourself from your dashboard settings, which deletes your
              account details, sessions, sign-in logs and device records.
              {consentRequired && " You can withdraw cookie consent at any time via \"Cookie settings\" in the footer."}{" "}
              For a copy of your data, or any other request, contact the site&apos;s operator.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Your obligations</h2>
            <p className="mt-2">
              If you collect personal data from real users, you&apos;re responsible for disclosing
              that accurately here and complying with the privacy laws that apply to you. Turning
              off &quot;Require consent&quot; in System Settings is only appropriate if none of your
              users are in the EU, the UK or another region with consent rules.
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
