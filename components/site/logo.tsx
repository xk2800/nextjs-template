import Link from "next/link"

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold">
      <span className="flex size-6 items-center justify-center rounded-md bg-foreground text-background text-sm font-bold">
        N
      </span>
      nextjs-template
    </Link>
  )
}
