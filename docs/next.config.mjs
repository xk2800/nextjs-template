import nextra from 'nextra'
import { createHighlighter } from 'shiki'

// Nextra's default highlighter loads all ~200 Shiki grammars, which was ~40% of
// a cold compile. Load only what the docs use; add a language here before
// using it in a code fence (unknown ones render as plain text).
const CODE_LANGS = ['bash', 'css', 'json', 'sql', 'ts', 'tsx']

const withNextra = nextra({
  mdxOptions: {
    rehypePrettyCodeOptions: {
      getHighlighter: (opts) => createHighlighter({ ...opts, langs: CODE_LANGS }),
    },
  },
})

export default withNextra({
  output: 'standalone',
  // The parent repo's bun.lockb otherwise makes Next infer the template root as
  // the workspace root, which pulls in its proxy.ts and breaks the build.
  turbopack: { root: import.meta.dirname },
  // Same reason for standalone output: keeps server.js at .next/standalone/
  // (not .next/standalone/docs/) whether or not the parent repo is present.
  outputFileTracingRoot: import.meta.dirname,
  // dev and build run with --webpack on purpose:
  // - Turbopack runs Nextra's MDX loader in one Node worker per CPU core
  //   (~280MB each, all pegged at 100% on first compile), stalling the machine.
  // - Turbopack can't pass functions to loaders, so getHighlighter above
  //   would not apply there.
})
