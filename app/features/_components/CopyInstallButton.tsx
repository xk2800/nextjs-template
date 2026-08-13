'use client'

import { useState } from 'react'

export default function CopyInstallButton({ command, className }: { command: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — fail silently,
      // the command is already right there in plain text to select.
    }
  }

  return (
    <button
      type="button"
      className={className}
      data-copied={copied || undefined}
      onClick={handleCopy}
    >
      {copied ? 'copied' : 'copy'}
    </button>
  )
}
