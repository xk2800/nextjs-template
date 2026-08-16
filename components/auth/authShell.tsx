import type { ReactNode } from "react"
import { Check } from "lucide-react"

import { Logo } from "@/components/site/logo"
import { ThemeToggle } from "@/components/theme/theme-toggle"

type Props = {
  headline: string
  bullets: string[]
  children: ReactNode
}

export function AuthShell({ headline, bullets, children }: Props) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-center border-r border-border/60 bg-secondary/30 p-10 lg:flex">
        <div className="absolute top-10 left-10">
          <Logo />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">{headline}</h1>
          <ul className="mt-6 flex flex-col gap-3">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-500" />
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col p-6 sm:p-10">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="lg:hidden">
            <Logo />
          </div>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  )
}
