import { fileURLToPath } from "node:url"
import type { StorybookConfig } from "@storybook/nextjs-vite"

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))
const mocks = r("./mocks.ts")

const config: StorybookConfig = {
  // Stories live outside components/ on purpose: everything under components/
  // ships to npm and gets rewritten by create-nextjs.
  stories: ["../stories/**/*.stories.tsx"],
  framework: "@storybook/nextjs-vite",
  addons: ["@storybook/addon-docs"],
  staticDirs: ["../public"],
  // Lets async server components (the *Section / *Card data loaders) render.
  features: { experimentalRSC: true },
  viteFinal: async (config) => {
    config.resolve ??= {}
    const existing = config.resolve.alias ?? []
    config.resolve.alias = [
      // DB / server-only modules → fixtures, so stories need no database.
      { find: /^@xk2800\/nextjs-template\/(activity|admin|users|sessions|settings)\/queries$/, replacement: mocks },
      { find: /^@\/server\/auth$/, replacement: mocks },
      { find: /^(\.\.\/)+lib\/request-info$/, replacement: mocks },
      // Auth client → fake session + no-op API calls.
      { find: /^(@\/|(\.\.\/)+)lib\/auth-client$/, replacement: mocks },
      { find: /^@xk2800\/nextjs-template\/auth-client$/, replacement: mocks },
      // Package self-imports → local source.
      { find: /^@xk2800\/nextjs-template\/lib\/(.*)$/, replacement: r("../lib/$1.ts") },
      ...(Array.isArray(existing) ? existing : Object.entries(existing).map(([find, replacement]) => ({ find, replacement }))),
    ]
    return config
  },
}

export default config
