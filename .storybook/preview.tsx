import type { Preview } from "@storybook/nextjs-vite"
import { Toaster } from "sonner"
import { ThemeProvider } from "../components/providers/theme-provider"
import { defaultSession, MockSessionContext, setMockSession, type MockSession } from "./mocks"
import "../app/globals.css"

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
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </MockSessionContext.Provider>
      )
    },
  ],
}

export default preview
