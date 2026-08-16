import { Badge } from "@/components/ui/badge"
import { SiteHeader } from "@/components/site/site-header"
import { SiteFooter } from "@/components/site/site-footer"

export interface ChangelogEntry {
  version: string
  date: string
  type?: "feature" | "improvement" | "fix"
  title?: string
  changes: string[]
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  })
}

export function ChangelogView({
  active,
  entries,
}: {
  active?: "features" | "changelog"
  entries: ChangelogEntry[]
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader active={active} />

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <header>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Changelog</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            All the latest features, improvements, and bug fixes.
          </p>
        </header>

        <div className="mt-12">
          {entries.map((entry) => (
            <article
              key={entry.version}
              className="grid gap-2 border-t border-border/60 py-8 first:border-t-0 first:pt-0 sm:grid-cols-[minmax(0,9rem)_1fr] sm:gap-8"
            >
              <div>
                <p className="font-mono text-sm font-semibold">v{entry.version}</p>
                <p className="mt-1 text-sm text-muted-foreground">{formatDate(entry.date)}</p>
                {entry.type && (
                  <Badge variant={entry.type === "feature" ? "default" : "outline"} className="mt-3">
                    {entry.type}
                  </Badge>
                )}
              </div>
              <div>
                {entry.title && (
                  <h2 className="text-xl font-semibold tracking-tight">{entry.title}</h2>
                )}
                <ul className={entry.title ? "mt-3 flex flex-col gap-2" : "flex flex-col gap-2"}>
                  {entry.changes.map((change) => (
                    <li key={change} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground/60" />
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
