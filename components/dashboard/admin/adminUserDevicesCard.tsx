import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card"
import { formatLocation } from "../../../lib/request-info"

interface UserDevice {
  id: string
  visitorId: string
  device: string
  ipAddress: string | null
  country: string | null
  city: string | null
  components: Record<string, unknown> | null
  createdAt: Date
}

// Signals arrive as whatever FingerprintJS produced: primitives, arrays,
// nested objects, or { hash } for values too large to store (canvas etc.).
function formatSignal(value: unknown): string {
  if (value === null || value === undefined) return "—"
  if (Array.isArray(value) && value.every((v) => typeof v !== "object")) return value.join(", ") || "—"
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

// Every device this account has signed in from (device_fingerprint rows),
// each with the FingerprintJS signals behind its visitorId in a collapsible
// section. Accessibility signals are never collected (lib/device-fingerprint.ts).
export default function AdminUserDevicesCard({ devices }: { devices: UserDevice[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Devices</CardTitle>
        <CardDescription>
          Devices this account has signed in from, with the browser and device signals behind each
          fingerprint. Only recorded for visitors who accepted optional cookies (when consent is required).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No devices recorded</p>
        ) : (
          <div className="divide-y divide-border rounded-md border border-border">
            {devices.map((d) => {
              const signals = d.components ? Object.entries(d.components) : []
              return (
                <details key={d.id} className="group p-4">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{d.device}</p>
                      <p className="text-sm text-gray-500">
                        {formatLocation({ country: d.country, city: d.city })} · {d.ipAddress ?? "Unknown IP"} · first seen{" "}
                        {d.createdAt.toLocaleString()}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500 group-open:hidden">Show {signals.length} signals</span>
                    <span className="hidden text-sm text-gray-500 group-open:inline">Hide signals</span>
                  </summary>
                  <p className="mt-3 break-all font-mono text-xs text-gray-500">visitorId: {d.visitorId}</p>
                  {signals.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-500">
                      No signals yet. They&apos;re collected the next time this device signs in.
                    </p>
                  ) : (
                    <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-[max-content_1fr]">
                      {signals.map(([name, value]) => (
                        <div key={name} className="contents">
                          <dt className="font-mono text-gray-500">{name}</dt>
                          <dd className="mb-2 break-all font-mono sm:mb-0">{formatSignal(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </details>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
