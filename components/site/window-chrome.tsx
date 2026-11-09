export function WindowChrome({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5">
      <span className="size-2.5 rounded-full bg-destructive/60" />
      <span className="size-2.5 rounded-full bg-yellow-500/60" />
      <span className="size-2.5 rounded-full bg-green-500/60" />
      <span className="ml-2 font-mono text-xs text-muted-foreground">{label}</span>
    </div>
  )
}
