"use client"

import * as React from "react"
import { Camera, ImagePlus, Upload, X } from "lucide-react"

import { Button } from "./button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu"
import { cn } from "../../lib/utils"

type FileUploadProps = {
  /** Take a photo with the device camera (rear camera on mobile; a file picker on desktop). */
  camera?: boolean
  /** Pick existing files from the gallery / file system. */
  gallery?: boolean
  /** Drop files onto the component. */
  dragDrop?: boolean
  /**
   * Pressing the drop zone opens the picker instead of showing separate buttons. With both
   * `camera` and `gallery` the user is asked which one; with one, it opens directly. Needs `dragDrop`.
   */
  clickable?: boolean
  /** Same format as `<input accept>`. Also enforced on dropped files. */
  accept?: string
  multiple?: boolean
  maxFiles?: number
  maxSizeMB?: number
  disabled?: boolean
  /** Drop zone icon. Pass `null` to hide it. */
  icon?: React.ReactNode
  /** Drop zone text. Defaults to "Drag and drop files here" (or "a file" when `multiple` is false). */
  label?: React.ReactNode
  /** Smaller sub text under the drop zone label. */
  description?: React.ReactNode
  /** Extra classes for the dashed drop zone box. */
  dropzoneClassName?: string
  /** Extra classes for the label text. */
  labelClassName?: string
  /** Extra classes for the description text. */
  descriptionClassName?: string
  onFilesChange?: (files: File[]) => void
  className?: string
}

function matchesAccept(file: File, accept: string) {
  return accept.split(",").some((raw) => {
    const rule = raw.trim().toLowerCase()
    if (!rule) return false
    if (rule.startsWith(".")) return file.name.toLowerCase().endsWith(rule)
    if (rule.endsWith("/*")) return file.type.startsWith(rule.slice(0, -1))
    return file.type === rule
  })
}

function FileUpload({
  camera = false,
  gallery = false,
  dragDrop = false,
  clickable = false,
  accept = "image/*",
  multiple = true,
  maxFiles,
  maxSizeMB,
  disabled = false,
  icon = <Upload className="size-6" />,
  label,
  description,
  dropzoneClassName,
  labelClassName,
  descriptionClassName,
  onFilesChange,
  className,
}: FileUploadProps) {
  const [files, setFiles] = React.useState<File[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [dragging, setDragging] = React.useState(false)
  const cameraRef = React.useRef<HTMLInputElement>(null)
  const galleryRef = React.useRef<HTMLInputElement>(null)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const pointerType = React.useRef("")

  // Created and revoked in the same effect: with useMemo, Strict Mode's
  // simulated unmount revoked the URLs and the remount reused the dead ones.
  const [previews, setPreviews] = React.useState<(string | null)[]>([])
  React.useEffect(() => {
    const urls = files.map((f) => (f.type.startsWith("image/") ? URL.createObjectURL(f) : null))
    // eslint-disable-next-line react-hooks/set-state-in-effect -- object URLs must be created where they're revoked
    setPreviews(urls)
    return () => urls.forEach((url) => url && URL.revokeObjectURL(url))
  }, [files])

  const update = (next: File[]) => {
    setFiles(next)
    onFilesChange?.(next)
  }

  const add = (incoming: File[]) => {
    const limit = multiple ? (maxFiles ?? Infinity) : 1
    const accepted: File[] = []
    let rejected: string | null = null
    for (const file of incoming) {
      if (!matchesAccept(file, accept)) rejected = `${file.name} is not an accepted file type.`
      else if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) rejected = `${file.name} is larger than ${maxSizeMB} MB.`
      else accepted.push(file)
    }
    const base = multiple ? files : []
    const next = [...base, ...accepted].slice(0, limit)
    if (base.length + accepted.length > limit) rejected = `You can upload up to ${limit} file${limit === 1 ? "" : "s"}.`
    setError(rejected)
    if (accepted.length) update(next)
  }

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    add(Array.from(e.target.files ?? []))
    e.target.value = "" // allow picking the same file again
  }

  const remove = (index: number) => {
    setError(null)
    update(files.filter((_, i) => i !== index))
  }

  if (!camera && !gallery && !dragDrop) return null

  // Pressing the drop zone only does something if there's a picker to open.
  const pickable = clickable && !disabled && (camera || gallery)
  // The camera only means something on touch devices, so mouse and keyboard skip the
  // question and open the gallery (or the only source there is).
  const openDefault = () => (gallery ? galleryRef : cameraRef).current?.click()
  const units = multiple ? "files" : "a file"

  const buttons = (
    <div className="flex flex-wrap justify-center gap-2">
      {camera && (
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => cameraRef.current?.click()}>
          <Camera /> Take photo
        </Button>
      )}
      {gallery && (
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => galleryRef.current?.click()}>
          <ImagePlus /> Choose from gallery
        </Button>
      )}
    </div>
  )

  return (
    <div className={cn("space-y-3", className)}>
      {camera && (
        <input ref={cameraRef} type="file" accept={accept} capture="environment" hidden disabled={disabled} onChange={onInput} />
      )}
      {gallery && (
        <input ref={galleryRef} type="file" accept={accept} multiple={multiple} hidden disabled={disabled} onChange={onInput} />
      )}

      {dragDrop ? (
        <PickerMenu
          enabled={pickable && camera && gallery}
          open={menuOpen}
          onOpenChange={setMenuOpen}
          onCamera={() => cameraRef.current?.click()}
          onGallery={() => galleryRef.current?.click()}
        >
          <div
            role={pickable ? "button" : undefined}
            tabIndex={pickable ? 0 : undefined}
            // Radix opens the menu on pointerdown, which fires when a scroll starts on the
            // drop zone. Block that and decide on click (a real tap) instead.
            onPointerDown={
              pickable
                ? (e) => {
                    pointerType.current = e.pointerType
                    e.preventDefault()
                  }
                : undefined
            }
            onClick={
              pickable
                ? () => {
                    if (camera && gallery && pointerType.current !== "mouse") setMenuOpen(true)
                    else openDefault()
                    pointerType.current = ""
                  }
                : undefined
            }
            onKeyDown={
              pickable
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      openDefault()
                    }
                  }
                : undefined
            }
            onDragOver={(e) => {
              e.preventDefault()
              if (!disabled) setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              if (!disabled) add(Array.from(e.dataTransfer.files))
            }}
            aria-disabled={disabled}
            className={cn(
              "flex flex-col items-center gap-3 rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground transition-colors",
              pickable && "cursor-pointer outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring",
              // Before the state classes so a custom border can't hide the drag highlight.
              dropzoneClassName,
              dragging && "border-primary bg-primary/5",
              disabled && "opacity-50"
            )}
          >
            {icon}
            <div className="space-y-1">
              <p className={labelClassName}>
                {label ??
                  (pickable ? (
                    <>
                      <span className="pointer-coarse:hidden">Drag and drop {units} here, or click to browse</span>
                      <span className="hidden pointer-coarse:inline">Tap to add {units}</span>
                    </>
                  ) : (
                    `Drag and drop ${units} here`
                  ))}
              </p>
              {description && <p className={cn("text-xs", descriptionClassName)}>{description}</p>}
            </div>
            {!pickable && buttons}
          </div>
        </PickerMenu>
      ) : (
        buttons
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {files.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {files.map((file, i) => (
            <li key={`${file.name}-${file.lastModified}-${i}`} className="relative aspect-square overflow-hidden rounded-md border bg-muted">
              {previews[i] ? (
                // eslint-disable-next-line @next/next/no-img-element -- blob: URLs can't go through next/image
                <img src={previews[i]!} alt={file.name} className="size-full object-cover" />
              ) : (
                <span className="flex size-full items-center justify-center break-all p-2 text-xs">{file.name}</span>
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={disabled}
                aria-label={`Remove ${file.name}`}
                className="absolute top-1 right-1 rounded-full bg-background/80 p-1 text-foreground hover:bg-background"
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Wraps the drop zone in a "Take photo / Choose from gallery" menu when `enabled`. */
function PickerMenu({
  enabled,
  open,
  onOpenChange,
  onCamera,
  onGallery,
  children,
}: {
  enabled: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onCamera: () => void
  onGallery: () => void
  children: React.ReactElement
}) {
  if (!enabled) return children
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        <DropdownMenuItem onSelect={onCamera}>
          <Camera className="mr-2 size-4" /> Take photo
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onGallery}>
          <ImagePlus className="mr-2 size-4" /> Choose from gallery
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { FileUpload, matchesAccept }
export type { FileUploadProps }
