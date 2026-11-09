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

export type CategoryOption<TId extends string | number = number> = {
  id: TId
  name: string
  color?: string | null
}

/** Extra names offered below the user's own categories, e.g. tax-relief or budget-bucket names. */
export type SuggestionGroup = {
  heading: string
  items: { name: string; note?: string }[]
}

interface CategorySelectorProps<TId extends string | number> {
  /** The user's existing categories. */
  categories: CategoryOption<TId>[]
  isLoading?: boolean
  value?: TId | null
  onCategoryChange?: (categoryId: TId | null) => void
  onNewCategoryChange?: (categoryName: string) => void
  newCategoryValue?: string
  className?: string
  placeholder?: string
  disabled?: boolean
  /**
   * Picking a suggestion selects the existing category with that name (case-insensitive),
   * or opens the new-category input pre-filled with it.
   */
  suggestionGroups?: SuggestionGroup[]
  /** Small print under the new-category input. */
  newCategoryNote?: string
}

/** Combobox over the user's categories, with optional suggestion groups and "Add new category". */
export function CategorySelector<TId extends string | number = number>({
  categories,
  isLoading = false,
  value,
  onCategoryChange,
  onNewCategoryChange,
  newCategoryValue = "",
  className,
  placeholder = "Select category...",
  disabled = false,
  suggestionGroups,
  newCategoryNote,
}: CategorySelectorProps<TId>) {
  const [open, setOpen] = React.useState(false)
  const [showNewInput, setShowNewInput] = React.useState(false)

  const selectedCategory = categories.find((category) => category.id === value)
  const groups = suggestionGroups?.filter((g) => g.items.length > 0) ?? []

  const handleCategorySelect = (categoryId: TId) => {
    onCategoryChange?.(categoryId)
    setShowNewInput(false)
    setOpen(false)
  }

  const handleAddNewCategory = () => {
    onCategoryChange?.(null)
    setShowNewInput(true)
    setOpen(false)
  }

  // When a suggestion is picked: select existing match by ID, or pre-fill new-category input
  const handleSuggestionSelect = (name: string) => {
    const existing = categories.find((c) => c.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      handleCategorySelect(existing.id)
    } else {
      onCategoryChange?.(null)
      onNewCategoryChange?.(name)
      setShowNewInput(true)
      setOpen(false)
    }
  }

  const isSuggestionSelected = (name: string) =>
    selectedCategory?.name.toLowerCase() === name.toLowerCase() ||
    newCategoryValue.toLowerCase() === name.toLowerCase()

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
            {isLoading ? (
              "Loading categories..."
            ) : selectedCategory ? (
              <div className="flex items-center gap-2">
                {selectedCategory.color && (
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedCategory.color }}
                  />
                )}
                {selectedCategory.name}
              </div>
            ) : showNewInput ? (
              "Add new category"
            ) : (
              placeholder
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search categories..." />
            <CommandList>
              <CommandEmpty>No categories found.</CommandEmpty>

              <CommandGroup heading={groups.length ? "My Categories" : undefined}>
                {categories.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={category.name}
                    onSelect={() => handleCategorySelect(category.id)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {category.color && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                      {category.name}
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === category.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
                <CommandItem onSelect={handleAddNewCategory}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add new category
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
                        onSelect={() => handleSuggestionSelect(s.name)}
                      >
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="truncate">{s.name}</span>
                          {s.note && (
                            <span className="text-xs text-muted-foreground truncate">{s.note}</span>
                          )}
                        </div>
                        <Check
                          className={cn(
                            "ml-2 h-4 w-4 shrink-0",
                            isSuggestionSelected(s.name) ? "opacity-100" : "opacity-0"
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

      {/* New category input - shown when "Add new" is selected */}
      {showNewInput && (
        <>
          <Input
            placeholder="Enter new category name..."
            value={newCategoryValue}
            onChange={(e) => onNewCategoryChange?.(e.target.value)}
            disabled={disabled}
            autoFocus
          />
          {newCategoryNote && <Disclaimer disclaimerText={newCategoryNote} />}
        </>
      )}
    </div>
  )
}
