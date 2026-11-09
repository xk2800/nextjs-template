import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { CONSENT_PURPOSES, consentAllows, type ConsentPurpose } from "../../../lib/cookie-names"
import { formatDateTime } from "../../../lib/formatters"

interface ConsentRecord {
  id: string
  choice: string
  version: number
  createdAt: Date
}

const PURPOSE_LABELS: Record<ConsentPurpose, string> = {
  fingerprint: "Security fingerprint",
  onetap: "Google One Tap",
}

function describeChoice(choice: string): string {
  if (choice === "all") return "Accepted all"
  if (choice === "necessary") return "Necessary only"
  return "Custom"
}

// The user's cookie-consent records (consent_log, proof of consent under GDPR
// Art. 7(1)): the current choice per purpose, then every change with the
// consent-text version it was given under.
export default function AdminUserConsentCard({
  records,
  consentRequired,
}: {
  records: ConsentRecord[]
  consentRequired: boolean
}) {
  const current = records[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consent</CardTitle>
        <CardDescription>
          Cookie choices this user made while signed in, kept as proof of consent
          {!consentRequired && ". Consent isn't currently required, so new choices aren't being recorded"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!current ? (
          <p className="text-center text-gray-500 py-8">No consent recorded</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {CONSENT_PURPOSES.map((purpose) => {
                const allowed = consentAllows(current.choice, purpose)
                return (
                  <Badge key={purpose} variant={allowed ? "default" : "outline"}>
                    {PURPOSE_LABELS[purpose]}: {allowed ? "allowed" : "declined"}
                  </Badge>
                )
              })}
            </div>
            <ul className="divide-y divide-border rounded-md border border-border text-sm">
              {records.map((r, i) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
                  <span>
                    <span className="font-medium">{describeChoice(r.choice)}</span>
                    <span className="ml-2 font-mono text-xs text-gray-500">{r.choice}</span>
                    {i === 0 && <span className="ml-2 text-xs text-gray-500">(current)</span>}
                  </span>
                  <span className="text-gray-500">
                    v{r.version} · {formatDateTime(r.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
