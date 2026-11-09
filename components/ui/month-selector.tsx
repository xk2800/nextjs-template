"use client"

import * as React from "react"
import { Check, ChevronDown, Calendar } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"
import { format, subMonths } from "date-fns"

export interface MonthFilter {
  month: string
  year: string
}

interface MonthSelectorProps {
  value?: MonthFilter | null
  onMonthChange: (filter: MonthFilter | null) => void
  placeholder?: string
  className?: string
}

// Generate list of recent months
function generateMonthOptions(lookbackMonths: number = 24) {
  const options: Array<{ label: string; month: string; year: string }> = []
  const now = new Date()

  for (let i = 0; i < lookbackMonths; i++) {
    const date = subMonths(now, i)
    options.push({
      label: format(date, 'MMMM yyyy'), // "May 2026"
      month: format(date, 'M'), // "5"
      year: format(date, 'yyyy'), // "2026"
    })
  }

  return options
}

// Preset quick filters
const MONTH_PRESETS = [
  { label: "This Month", offset: 0 },
  { label: "Last Month", offset: 1 },
  { label: "2 Months Ago", offset: 2 },
]

export function MonthSelector({
  value,
  onMonthChange,
  placeholder = "Filter by month...",
  className,
}: MonthSelectorProps) {
  const [open, setOpen] = React.useState(false)

  const monthOptions = React.useMemo(() => generateMonthOptions(24), [])

  // Find the display label for selected month
  const selectedLabel = React.useMemo(() => {
    if (!value) return null
    const option = monthOptions.find(
      (opt) => opt.month === value.month && opt.year === value.year
    )
    return option?.label || `${value.month}/${value.year}`
  }, [value, monthOptions])

  const handlePresetSelect = (offset: number) => {
    const date = subMonths(new Date(), offset)
    onMonthChange({
      month: format(date, 'M'),
      year: format(date, 'yyyy'),
    })
    setOpen(false)
  }

  const handleMonthSelect = (month: string, year: string) => {
    onMonthChange({ month, year })
    setOpen(false)
  }

  const handleAllTimeSelect = () => {
    onMonthChange(null)
    setOpen(false)
  }

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 opacity-50" />
              {value ? selectedLabel : value === null ? "All Time" : placeholder}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search months..." />
            <CommandList>
              <CommandEmpty>No months found.</CommandEmpty>

              {/* Quick Presets */}
              <CommandGroup heading="Quick Filters">
                {MONTH_PRESETS.map((preset) => {
                  const presetDate = subMonths(new Date(), preset.offset)
                  const presetMonth = format(presetDate, 'M')
                  const presetYear = format(presetDate, 'yyyy')
                  const isSelected = value?.month === presetMonth && value?.year === presetYear

                  return (
                    <CommandItem
                      key={preset.label}
                      value={preset.label}
                      onSelect={() => handlePresetSelect(preset.offset)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {preset.label}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {format(presetDate, 'MMM yyyy')}
                      </span>
                    </CommandItem>
                  )
                })}

                {/* All Time Option */}
                <CommandItem
                  value="All Time"
                  onSelect={handleAllTimeSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === null ? "opacity-100" : "opacity-0"
                    )}
                  />
                  All Time
                </CommandItem>
              </CommandGroup>

              <CommandSeparator />

              {/* Month List */}
              <CommandGroup heading="Select Month">
                {monthOptions.map((option) => {
                  const isSelected =
                    value?.month === option.month && value?.year === option.year

                  return (
                    <CommandItem
                      key={`${option.month}-${option.year}`}
                      value={option.label}
                      onSelect={() => handleMonthSelect(option.month, option.year)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
