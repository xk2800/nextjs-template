"use client"

import * as React from "react"
import { Check, ChevronDown, Plus } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Input } from "./input"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./command"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Disclaimer } from "./disclaimer"
import type { SuggestionGroup } from "./category-selector"

interface SourceSelectorProps {
  /** The user's existing sources. The value is the source name. */
  sources: { id: string | number; name: string }[]
  isLoading?: boolean
  value?: string
  onSourceChange?: (sourceName: string) => void
  onNewSourceChange?: (newSourceName: string) => void
  newSourceValue?: string
  className?: string
  placeholder?: string
  disabled?: boolean
  /** Extra names offered below the user's own sources; picking one selects that name. */
  suggestionGroups?: SuggestionGroup[]
  /** Small print under the new-source input. */
  newSourceNote?: string
}

/** Combobox over named sources (selected by name), with optional suggestion groups and "Add new source". */
export function SourceSelector({
  sources,
  isLoading = false,
  value,
  onSourceChange,
  onNewSourceChange,
  newSourceValue = "",
  className,
  placeholder = "Select a source...",
  disabled = false,
  suggestionGroups,
  newSourceNote,
}: SourceSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [showNewInput, setShowNewInput] = React.useState(false)
  const groups = suggestionGroups?.filter((g) => g.items.length > 0) ?? []

  const handleSourceSelect = (name: string) => {
    onSourceChange?.(name)
    onNewSourceChange?.("")
    setShowNewInput(false)
    setOpen(false)
  }

  const handleAddNew = () => {
    onSourceChange?.("")
    setShowNewInput(true)
    setOpen(false)
  }

  const triggerLabel = isLoading
    ? "Loading..."
    : value
      ? value
      : showNewInput
        ? "Add new source"
        : placeholder

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled || isLoading}
          >
            {triggerLabel}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search sources..." />
            <CommandList>
              <CommandEmpty>No sources found.</CommandEmpty>

              <CommandGroup heading={groups.length ? "My Sources" : undefined}>
                {sources.map((source) => (
                  <CommandItem
                    key={source.id}
                    value={source.name}
                    onSelect={() => handleSourceSelect(source.name)}
                  >
                    {source.name}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === source.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
                <CommandItem onSelect={handleAddNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add new source
                </CommandItem>
              </CommandGroup>

              {groups.map((group) => (
                <React.Fragment key={group.heading}>
                  <CommandSeparator />
                  <CommandGroup heading={group.heading}>
                    {group.items.map((s) => (
                      <CommandItem
                        key={s.name}
                        value={s.name}
                        onSelect={() => handleSourceSelect(s.name)}
                      >
                        <div className="flex flex-col">
                          <span>{s.name}</span>
                          {s.note && <span className="text-xs text-muted-foreground">{s.note}</span>}
                        </div>
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4 shrink-0",
                            value === s.name ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </React.Fragment>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {showNewInput && (
        <>
          <Input
            placeholder="Enter new source name..."
            value={newSourceValue}
            onChange={(e) => onNewSourceChange?.(e.target.value)}
            disabled={disabled}
            autoFocus
          />
          {newSourceNote && <Disclaimer disclaimerText={newSourceNote} />}
        </>
      )}
    </div>
  )
}
