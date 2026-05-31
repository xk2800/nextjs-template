import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
import type { ReactNode } from 'react'

export const metadata = {
  title: {
    default: 'Next.js Template Docs',
    template: '%s – Next.js Template Docs',
  },
  description: 'Documentation for the Next.js Template project',
}

const navbar = (
  <Navbar
    logo={<span style={{ fontWeight: 700 }}>Next.js Template</span>}
    projectLink="https://github.com/xk2800/nextjs-template"
  />
)

const footer = <Footer>Next.js Template Documentation</Footer>

export default async function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          navbar={navbar}
          pageMap={await getPageMap()}
          footer={footer}
          docsRepositoryBase="https://github.com/xk2800/nextjs-template/tree/master/docs"
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
