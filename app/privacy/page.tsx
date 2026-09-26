import { SiteHeader } from "@/components/site/site-header"
import { SiteFooter } from "@/components/site/site-footer"

export const metadata = {
  title: "Privacy Policy — nextjs-template",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-4 rounded-lg border border-dashed border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
          This is placeholder content shipped with the template — it is not a real privacy policy.
          Replace this page with one that accurately describes what your deployment actually collects.
        </p>

        <div className="mt-10 flex flex-col gap-8 text-sm text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground">What this template collects by default</h2>
            <p className="mt-2">
              Account details you provide (name, email, password or OAuth identity), and — for every
              sign-in — device, browser, approximate location, and referrer, used for the audit log
              under Admin → Activity Logs. See <code className="font-mono">lib/request-info.ts</code>.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">Cookies and similar technologies</h2>
            <p className="mt-2">
              <span className="font-medium text-foreground">Always on (necessary):</span> sign-in
              session cookies, a 5-minute cookie remembering which page a sign-in started from, your
              cookie choice itself, sidebar and theme preferences, and short-lived browser storage for
              sign-in retries and &quot;what&apos;s new&quot; notices.
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">Only if you accept optional cookies:</span>{" "}
              a device fingerprint (FingerprintJS) used to alert you about sign-ins from new devices, to
              limit repeated failed sign-ins, and to spot one device creating many accounts; and Google
              One Tap sign-in, which loads a Google script that may use Google&apos;s own cookies. If
              you decline, failed sign-ins are limited by IP address instead.
            </p>
            <p className="mt-2">
              You can change your choice at any time via &quot;Cookie settings&quot; in the footer.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">Where it&apos;s stored</h2>
            <p className="mt-2">
              In your own Postgres database, via the schema in{" "}
              <code className="font-mono">server/db/schema.ts</code> — nothing here is sent to a
              third party by default.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">Your obligations</h2>
            <p className="mt-2">
              If you collect personal data from real users, you&apos;re responsible for disclosing
              that accurately here and complying with the privacy laws that apply to you.
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
