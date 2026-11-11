import { InfoTooltip } from '../../ui/info-tooltip'
import { Badge } from '../../ui/badge'
import { SEVERITY_LABELS, severityOf, type ActivitySeverity } from '../../../lib/activity-severity'

export const SEVERITY_MEANING: Record<ActivitySeverity, string> = {
  info: 'Routine activity, such as logins and profile updates.',
  warning: 'Something worth a look, such as failed logins or revoked sessions.',
  critical: 'Destructive actions, such as deleting or banning a user.',
  security: 'Admin privilege events: impersonation, role changes, settings changes.',
}

const DOTS: Record<ActivitySeverity, string> = {
  info: 'bg-blue-500',
  warning: 'bg-amber-500',
  critical: 'bg-red-500',
  security: 'bg-violet-500',
}

const STYLES: Record<ActivitySeverity, string> = {
  info: 'border-transparent bg-blue-100 text-blue-900 dark:bg-blue-500/15 dark:text-blue-300',
  warning: 'border-transparent bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300',
  critical: 'border-transparent bg-red-100 text-red-900 dark:bg-red-500/15 dark:text-red-300',
  security: 'border-transparent bg-violet-100 text-violet-900 dark:bg-violet-500/15 dark:text-violet-300',
}

export default function AuditSeverityBadge({ action }: { action: string }) {
  const severity = severityOf(action)
  return (
    <Badge className={`gap-1.5 ${STYLES[severity]}`} title={SEVERITY_MEANING[severity]}>
      <span className={`size-1.5 rounded-full ${DOTS[severity]}`} aria-hidden />
      {SEVERITY_LABELS[severity]}
    </Badge>
  )
}

// ⓘ popover for the toolbar: what each severity level means.
export function SeverityLegend() {
  return (
    <InfoTooltip title="Severity levels">
      <ul className="space-y-2">
        {(Object.keys(SEVERITY_MEANING) as ActivitySeverity[]).map((k) => (
          <li key={k} className="flex items-start gap-2">
            <span className={`mt-1.5 size-2 shrink-0 rounded-full ${DOTS[k]}`} aria-hidden />
            <span><strong>{SEVERITY_LABELS[k]}</strong>: {SEVERITY_MEANING[k]}</span>
          </li>
        ))}
      </ul>
    </InfoTooltip>
  )
}
