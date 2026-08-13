'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

export default function RevealOnScroll({
  children,
  className,
  visibleClassName,
}: {
  children: ReactNode
  className?: string
  visibleClassName?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion || !('IntersectionObserver' in window)) {
      setVisible(true)
      return
    }

    const el = ref.current
    if (!el) return

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.unobserve(el)
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className={[className, visible ? visibleClassName : undefined].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}
