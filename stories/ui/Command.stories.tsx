import * as React from "react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Button } from "../../components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "../../components/ui/command"

/**
 * Searchable list (cmdk). Install the optional peer first: `bun add cmdk`.
 * Use it inline (e.g. inside a `Popover` for a combobox) or wrap the same children in
 * `CommandDialog` for a ⌘K palette. `CommandItem`'s `onSelect` runs on click or Enter.
 */
const meta = {
  title: "UI/Command",
  component: Command,
  args: { className: "max-w-sm rounded-lg border" },
} satisfies Meta<typeof Command>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Command {...args}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>Calendar</CommandItem>
          <CommandItem>Search emoji</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>Profile<CommandShortcut>⌘P</CommandShortcut></CommandItem>
          <CommandItem>Billing<CommandShortcut>⌘B</CommandShortcut></CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
}

/**
 * ⌘K palette: `CommandDialog` is controlled by your own `open` state. Open it from a button or a
 * ⌘K / Ctrl+K key handler; ✕, Esc and clicking outside close it via `onOpenChange`, and an item's
 * `onSelect` should close it too.
 */
export const Palette: Story = {
  render: function Render() {
    const [open, setOpen] = React.useState(false)
    const [picked, setPicked] = React.useState<string>()

    React.useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          setOpen((o) => !o)
        }
      }
      document.addEventListener("keydown", onKeyDown)
      return () => document.removeEventListener("keydown", onKeyDown)
    }, [])

    const pick = (page: string) => {
      setPicked(page)
      setOpen(false)
    }

    return (
      <div className="flex items-center gap-3 text-sm">
        <Button variant="outline" onClick={() => setOpen(true)}>
          Search… <kbd className="text-muted-foreground ml-2 text-xs">⌘K</kbd>
        </Button>
        {picked && <span className="text-muted-foreground">Picked: {picked}</span>}
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Type a command..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Pages">
              <CommandItem onSelect={() => pick("Dashboard")}>Dashboard</CommandItem>
              <CommandItem onSelect={() => pick("Settings")}>Settings</CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </div>
    )
  },
}
