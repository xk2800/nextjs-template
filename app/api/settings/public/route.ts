import { NextResponse } from "next/server"
import { getEffectiveAuthFlags } from "@/lib/settings-queries"

// Public, unauthenticated — only exposes the subset of settings a
// not-yet-signed-in client needs to decide what to render (e.g. whether to
// trigger the Google One Tap prompt). Never add anything here a logged-out
// visitor shouldn't see.
export async function GET() {
  const flags = await getEffectiveAuthFlags()
  return NextResponse.json(
    { oneTapEnabled: flags.oneTap },
    { headers: { "Cache-Control": "private, max-age=5" } }
  )
}
