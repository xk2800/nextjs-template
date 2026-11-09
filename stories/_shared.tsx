import type { Decorator } from "@storybook/nextjs-vite"
import { useEffect, useState, type ReactElement } from "react"
// The Next.js Storybook plugin maps this to the React copy Next bundles; going
// through @react-email/render pulled in a second React and crashed.
import { renderToReadableStream } from "react-dom/server"

/** Form-width wrapper for small auth widgets. */
export const narrow: Decorator = (Story) => <div className="max-w-sm"><Story /></div>

/**
 * Render the story in its own iframe on the Docs page. Needed for anything
 * fixed/fullscreen (sidebars, modals, banners) so it doesn't cover the docs.
 */
export const ownFrame = (height = 600) => ({ docs: { story: { inline: false, height: `${height}px` } } })

// Emails are full <html> documents, so render them to HTML (as Resend would) and
// show them in an iframe instead of mounting them inside the Storybook page.
// Streaming render because <Tailwind> suspends; wait for allReady before reading.
export function EmailPreview({ email }: { email: ReactElement }) {
  const [html, setHtml] = useState("")
  useEffect(() => {
    renderToReadableStream(email).then(async (stream) => {
      await stream.allReady
      setHtml(await new Response(stream).text())
    })
  }, [email])
  return <iframe title="Email preview" srcDoc={html} className="h-[720px] w-full rounded-md border bg-white" />
}
