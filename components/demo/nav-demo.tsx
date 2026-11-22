import type { cookies } from "next/headers"

import type { MobileNavVariant } from "@/components/dashboard/layout/mobile-nav"
import NavDemoControls from "./nav-demo-controls"
import { MOBILE_NAV_COOKIE } from "./mobile-nav-cookie"

/**
 * Template demo site only. With NAV_DEMO_CONTROLS=true, returns the visitor's chosen mobile bottom
 * bar (from their cookie) and the header menu to change it; otherwise `base` and no menu.
 * Read from process.env on purpose: it is not in the env schema or the .env examples.
 * create-nextjs deletes this folder, and the `@demo` lines in app/dashboard/layout.tsx, from new projects.
 */
export function applyNavDemo(
  base: MobileNavVariant,
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): { mobileNav: MobileNavVariant; demoMenu: React.ReactNode } {
  if (process.env.NAV_DEMO_CONTROLS !== "true") return { mobileNav: base, demoMenu: null }
  const picked = cookieStore.get(MOBILE_NAV_COOKIE)?.value
  const mobileNav = picked === "tabs" || picked === "dock" || picked === "off" ? picked : base
  return { mobileNav, demoMenu: <NavDemoControls current={mobileNav} /> }
}
