/**
 * Patches nextra-theme-docs LayoutPropsSchema to fix a bug where
 * `children` is required in the strict schema but destructured out
 * before validation, causing "expected nonoptional" errors.
 *
 * This can be removed once the bug is fixed upstream.
 * See: https://github.com/shuding/nextra/issues/XXXX
 */
import { readFileSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const schemaPath = resolve(
  __dirname,
  '../node_modules/nextra-theme-docs/dist/schemas.js'
)

try {
  let content = readFileSync(schemaPath, 'utf8')
  const target = 'children: reactNode,'
  const replacement = 'children: reactNode.optional(),'

  if (content.includes(target)) {
    content = content.replace(target, replacement)
    writeFileSync(schemaPath, content)
    console.log('[patch-nextra] Patched LayoutPropsSchema children field')
  } else if (content.includes(replacement)) {
    console.log('[patch-nextra] Already patched')
  } else {
    console.log('[patch-nextra] Schema not found, skipping')
  }
} catch {
  console.log('[patch-nextra] Could not patch, skipping')
}
