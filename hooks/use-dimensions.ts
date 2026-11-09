"use client"

import * as React from "react"

/**
 * Live width of an element via ResizeObserver. `observe` is a ref callback for the
 * element to measure; `width` is its content-box width, updated on every resize.
 * SSR-safe: nothing touches the DOM until the ref callback runs on the client, and
 * `width` starts at 0 (treated as "unmeasured" by consumers).
 */
export function useDimensions() {
  const [width, setWidth] = React.useState(0)
  const observerRef = React.useRef<ResizeObserver | null>(null)

  const observe = React.useCallback((node: HTMLElement | null) => {
    observerRef.current?.disconnect()
    observerRef.current = null
    if (!node || typeof ResizeObserver === "undefined") return // SSR / unsupported: no-op

    const ro = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width)
    })
    ro.observe(node)
    observerRef.current = ro
    setWidth(node.getBoundingClientRect().width) // prime before the first resize event
  }, [])

  React.useEffect(() => () => observerRef.current?.disconnect(), [])

  return { observe, width }
}
