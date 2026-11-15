"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { XIcon } from "lucide-react"
import { Drawer } from "vaul"

import { useIsMobile } from "../../hooks/use-mobile"
import { cn } from "../../lib/utils"

// Below 768px (useIsMobile) the dialog renders as a vaul drawer: bottom sheet with a
// grab handle and swipe-down-to-dismiss. vaul has its own Radix instance, so every
// part must come from the same primitive set; the root picks it and shares it via context.
const MobileContext = React.createContext(false)
const usePrimitive = () => (React.useContext(MobileContext) ? Drawer : DialogPrimitive)

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const isMobile = useIsMobile()
  const Root = isMobile ? Drawer.Root : DialogPrimitive.Root
  return (
    <MobileContext.Provider value={isMobile}>
      <Root data-slot="dialog" {...props} />
    </MobileContext.Provider>
  )
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  const P = usePrimitive()
  return <P.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  const P = usePrimitive()
  return <P.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  const P = usePrimitive()
  return <P.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  const P = usePrimitive()
  return (
    <P.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  const isMobile = React.useContext(MobileContext)
  const P = usePrimitive()
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <P.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background fixed z-50 grid gap-4 border-(length:--surface-border-width) border-(--surface-border-color) p-6 shadow-(--dialog-shadow)",
          isMobile
            ? "flex flex-col inset-x-0 bottom-0 max-h-[90dvh] rounded-t-xl pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            : "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 top-[50%] left-[50%] max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] overflow-y-auto translate-x-[-50%] translate-y-[-50%] rounded-lg duration-200 sm:max-w-lg",
          className
        )}
        {...props}
      >
        {isMobile && (
          <div aria-hidden className="bg-muted-foreground/30 mx-auto -mt-2 h-1.5 w-12 shrink-0 rounded-full" />
        )}
        {isMobile ? (
          // Only this wrapper scrolls, and only when the content is taller than the drawer.
          <div className="grid min-h-0 gap-4 overflow-y-auto overscroll-contain">{children}</div>
        ) : (
          children
        )}
        {showCloseButton && (
          <P.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </P.Close>
        )}
      </P.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  const P = usePrimitive()
  return (
    <P.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  const P = usePrimitive()
  return (
    <P.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
