'use client'

import { useEffect, useState, useSyncExternalStore } from "react"
import { toast, type ExternalToast } from "sonner"
import FeedbackDialog from "./feedbackDialog"

// One hidden feedback dialog for reporting errors. Mount <ErrorFeedbackHost />
// once in a layout, only when feedback is configured (FEEDBACK_DISCORD_WEBHOOK_URL
// or FEEDBACK_EMAIL). Error toasts (toastError) and error pages (reportProblem)
// then open it as a bug report with the error filled in and attached. Where
// it isn't mounted, toastError is a plain toast.error.
let openReport: ((errorText: string) => void) | null = null
const listeners = new Set<() => void>()
function setOpenReport(fn: typeof openReport) {
  openReport = fn
  listeners.forEach((listener) => listener())
}

export function ErrorFeedbackHost() {
  const [errorText, setErrorText] = useState<string | null>(null)

  useEffect(() => {
    setOpenReport(setErrorText)
    return () => setOpenReport(null)
  }, [])

  return (
    <FeedbackDialog
      showTrigger={false}
      open={errorText !== null}
      onOpenChange={(open) => !open && setErrorText(null)}
      defaultType="bug"
      errorDetails={errorText ?? undefined}
      defaultMessage={
        errorText ? `Error: ${errorText}\n\nWhat were you doing when this happened?\n` : ""
      }
    />
  )
}

/** Whether a Report button can open the feedback form (host mounted and configured). */
export function useCanReportProblem() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => openReport !== null,
    () => false
  )
}

export function reportProblem(errorText: string) {
  openReport?.(errorText)
}

/** toast.error with a "Report" button that opens the feedback form pre-filled. */
export function toastError(message: string, options?: ExternalToast) {
  return toast.error(message, {
    ...(openReport && {
      action: { label: "Report", onClick: () => reportProblem(message) },
    }),
    ...options,
  })
}
