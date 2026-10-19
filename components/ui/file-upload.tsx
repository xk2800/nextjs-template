"use client"

import * as React from "react"
import { Camera, ImagePlus, Upload, X } from "lucide-react"

import { Button } from "./button"
import { cn } from "../../lib/utils"

type FileUploadProps = {
  /** Take a photo with the device camera (rear camera on mobile; a file picker on desktop). */
  camera?: boolean
  /** Pick existing files from the gallery / file system. */
  gallery?: boolean
  /** Drop files onto the component. */
  dragDrop?: boolean
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
  accept = "image/*",
  multiple = true,
  maxFiles,
  maxSizeMB,
  disabled = false,
  icon = <Upload className="size-6" />,
  label,
  onFilesChange,
  className,
}: FileUploadProps) {
  const [files, setFiles] = React.useState<File[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [dragging, setDragging] = React.useState(false)
  const cameraRef = React.useRef<HTMLInputElement>(null)
  const galleryRef = React.useRef<HTMLInputElement>(null)

  const previews = React.useMemo(
    () => files.map((f) => (f.type.startsWith("image/") ? URL.createObjectURL(f) : null)),
    [files]
  )
  React.useEffect(() => () => previews.forEach((url) => url && URL.revokeObjectURL(url)), [previews])

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
        <div
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
            dragging && "border-primary bg-primary/5",
            disabled && "opacity-50"
          )}
        >
          {icon}
          <p>{label ?? `Drag and drop ${multiple ? "files" : "a file"} here`}</p>
          {buttons}
        </div>
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

export { FileUpload, matchesAccept }
export type { FileUploadProps }
