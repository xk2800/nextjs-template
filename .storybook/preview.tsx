import type { Preview } from "@storybook/nextjs-vite"
import { Toaster } from "sonner"
import { ThemeProvider } from "../components/providers/theme-provider"
import { defaultSession, MockSessionContext, setMockSession, type MockSession } from "./mocks"
import { useIsMobile } from "../hooks/use-mobile"
import "../app/globals.css"

// Corner badge: same 768px breakpoint as useIsMobile / Tailwind `md`.
function ViewportBadge() {
  const isMobile = useIsMobile()
  return (
    <div className="pointer-events-none fixed bottom-2 left-2 z-[9999] rounded bg-black/70 px-2 py-1 font-mono text-xs text-white">
      {isMobile ? "Mobile" : "Desktop"} · &lt;768px = mobile
    </div>
  )
}

const preview: Preview = {
  // Every component gets a Docs page: overview, props table, then each story.
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    nextjs: { appDirectory: true },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
  globalTypes: {
    theme: {
      description: "Color theme",
      toolbar: { title: "Theme", icon: "mirror", items: ["light", "dark"], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: "light" },
  decorators: [
    (Story, { globals, parameters }) => {
      // `parameters.session`: null = signed out, or a custom { user, session }.
      const session: MockSession = parameters.session === undefined ? defaultSession : parameters.session
      setMockSession(session)
      return (
        <MockSessionContext.Provider value={session}>
          <ThemeProvider attribute="class" forcedTheme={globals.theme} disableTransitionOnChange>
            <Story />
            <ViewportBadge />
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </MockSessionContext.Provider>
      )
    },
  ],
}

export default preview
