// Query-string number clamped to [min, max]; junk or missing falls back to `def`.
export function clampInt(value: string | null, def: number, min: number, max: number): number {
  return Math.min(Math.max(parseInt(value ?? '') || def, min), max)
}
