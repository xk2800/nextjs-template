"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format, startOfMonth, endOfMonth, startOfYear, subMonths, subDays } from "date-fns"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Calendar } from "./calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

interface DatePickerWithPresetsProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disableFutureDates?: boolean
}

export function DatePickerWithPresets({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
  disableFutureDates = false,
}: DatePickerWithPresetsProps) {
  const [open, setOpen] = React.useState(false)

  const allPresets = [
    {
      name: "Today",
      date: new Date(),
    },
    {
      name: "Yesterday",
      date: subDays(new Date(), 1),
    },
    {
      name: "This Month Start",
      date: startOfMonth(new Date()),
    },
    {
      name: "Last Month Start",
      date: startOfMonth(subMonths(new Date(), 1)),
    },
    {
      name: "This Year Start",
      date: startOfYear(new Date()),
    },
  ]

  // Filter out future dates if disableFutureDates is true
  const presets = disableFutureDates
    ? allPresets.filter(preset => preset.date <= new Date())
    : allPresets

  const handlePresetClick = (presetDate: Date) => {
    onDateChange?.(presetDate)
    setOpen(false)
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    onDateChange?.(selectedDate)
    if (selectedDate) {
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col md:flex-row">
          {/* Presets — bottom on mobile, left on desktop */}
          <div className="order-last md:order-first flex flex-col gap-1 p-2 md:border-r md:min-w-[148px]">
            <div className="text-xs font-medium text-muted-foreground px-2 py-1">
              Presets
            </div>
            {presets.map((preset) => (
              <Button
                key={preset.name}
                variant="ghost"
                className="justify-start font-normal h-8"
                onClick={() => handlePresetClick(preset.date)}
              >
                {preset.name}
              </Button>
            ))}
          </div>
          {/* Calendar — top on mobile, right on desktop */}
          <div className="order-first md:order-last p-2">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              captionLayout="dropdown"
              disabled={disableFutureDates ? (date) => date > new Date() : undefined}
              defaultMonth={date || new Date()}
              startMonth={disableFutureDates ? new Date(2020, 0, 1) : undefined}
              endMonth={disableFutureDates ? new Date() : undefined}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}