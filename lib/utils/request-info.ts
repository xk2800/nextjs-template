import "server-only"
import { UAParser } from "ua-parser-js"
import geoip from "geoip-lite"

const countryNames = new Intl.DisplayNames(["en"], { type: "region" })

export type DeviceType = "desktop" | "mobile" | "tablet"

export interface DeviceInfo {
  os: string | null
  browser: string | null
  deviceType: DeviceType
}

export interface GeoInfo {
  country: string | null
  city: string | null
}

/**
 * Proxies append the address they saw to X-Forwarded-For, so the LAST entry
 * is the one our own proxy added; earlier entries are caller-supplied and
 * spoofable (they'd let an attacker dodge or frame an IP in the throttle).
 * Falls back to x-real-ip, then null (local dev with no proxy).
 * shortcut: assumes exactly one trusted proxy hop, so behind a CDN plus a
 * proxy the last entry is the CDN's address; revisit if you stack proxies.
 */
export function getClientIp(headers: Headers | undefined | null): string | null {
  const forwardedFor = headers?.get("x-forwarded-for")
  if (forwardedFor) return forwardedFor.split(",").at(-1)!.trim()

  return headers?.get("x-real-ip") ?? null
}

export function parseUserAgent(userAgent: string | null | undefined): DeviceInfo {
  if (!userAgent) {
    return { os: null, browser: null, deviceType: "desktop" }
  }

  const { os, browser, device } = new UAParser(userAgent).getResult()

  return {
    os: os.name ? [os.name, os.version].filter(Boolean).join(" ") : null,
    browser: browser.name ?? null,
    deviceType: device.type === "mobile" || device.type === "tablet" ? device.type : "desktop",
  }
}

/**
 * Offline lookup (geoip-lite ships its own IP-range database, no network
 * call) — resolves to nulls for private/local addresses like 127.0.0.1.
 */
export function lookupGeoLocation(ipAddress: string | null | undefined): GeoInfo {
  if (!ipAddress) return { country: null, city: null }

  const geo = geoip.lookup(ipAddress)
  if (!geo) return { country: null, city: null }

  let country: string | null = geo.country || null
  if (country) {
    try {
      country = countryNames.of(country) ?? country
    } catch {
      // Unrecognized region code — keep the raw code rather than losing it.
    }
  }

  return { country, city: geo.city || null }
}

export function formatDeviceInfo({ os, browser, deviceType }: DeviceInfo): string {
  const label = [browser, os].filter(Boolean).join(" on ")
  const typeLabel = deviceType === "mobile" ? "Mobile" : deviceType === "tablet" ? "Tablet" : "Desktop"

  return label ? `${label} · ${typeLabel}` : `Unknown device · ${typeLabel}`
}

export function formatLocation({ country, city }: GeoInfo): string {
  if (!country && !city) return "Unknown"

  return [city, country].filter(Boolean).join(", ")
}
