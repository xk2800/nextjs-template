import { SiteHeader } from "@/components/site/site-header"
import { SiteFooter } from "@/components/site/site-footer"

export const metadata = {
  title: "Terms of Service — nextjs-template",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-4 rounded-lg border border-dashed border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
          This is placeholder content shipped with the template — it is not real legal text. Replace
          this page with your own terms before you launch, ideally reviewed by a lawyer.
        </p>

        <div className="mt-10 flex flex-col gap-8 text-sm text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground">1. Using the service</h2>
            <p className="mt-2">
              By creating an account you agree to use this service only for lawful purposes and in
              accordance with these terms.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">2. Accounts</h2>
            <p className="mt-2">
              You&apos;re responsible for keeping your credentials secure and for all activity that
              happens under your account.
            </p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-foreground">3. Changes</h2>
            <p className="mt-2">
              These terms may change as the product changes. Material changes will be communicated
              before they take effect.
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
