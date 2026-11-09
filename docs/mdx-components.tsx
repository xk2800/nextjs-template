import { useMDXComponents as getThemeComponents } from 'nextra-theme-docs'
import type { MDXComponents } from 'mdx/types'
import type { ReactNode } from 'react'

const themeComponents = getThemeComponents()

// Status pill for headings, e.g. `## Feature <Badge>Beta</Badge>`.
function Badge({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-block',
        marginLeft: '0.5em',
        padding: '0.25em 0.6em',
        border: '1px solid currentColor',
        borderRadius: 9999,
        fontSize: '0.75rem',
        fontWeight: 500,
        lineHeight: 1,
        verticalAlign: 'middle',
        opacity: 0.7,
      }}
    >
      {children}
    </span>
  )
}

export function useMDXComponents(components?: MDXComponents) {
  return {
    ...themeComponents,
    Badge,
    ...components,
  }
}
