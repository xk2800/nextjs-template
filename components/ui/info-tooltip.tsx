'use client'

/**
 * InfoTooltip — a small ⓘ icon that opens a popover with a plain-English
 * explanation. Works on mobile (click) and desktop (click).
 */

import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Info } from 'lucide-react'
import { cn } from '../../lib/utils'

interface InfoTooltipProps {
  /** Short headline shown in bold */
  title: string
  /** Plain-English explanation — write like you're explaining to a 10-year-old */
  children: React.ReactNode
  className?: string
}

export function InfoTooltip({ title, children, className }: InfoTooltipProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center justify-center rounded-full text-muted-foreground',
            'hover:text-foreground transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-ring',
            className
          )}
          aria-label={`Explain: ${title}`}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-72 p-3 text-sm shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-semibold text-foreground mb-1">{title}</p>
        <div className="text-muted-foreground text-xs leading-relaxed space-y-1">
          {children}
        </div>
      </PopoverContent>
    </Popover>
  )
}
