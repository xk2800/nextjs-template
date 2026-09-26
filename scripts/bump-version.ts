import { select, confirm, input } from '@inquirer/prompts'
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

type BumpType = 'patch' | 'minor' | 'major'
type ChangelogType = 'feature' | 'improvement' | 'fix' | 'beta'

interface ChangelogEntry {
  version: string
  date: string
  type: ChangelogType
  title: string
  changes: string[]
}

const pkgPath = fileURLToPath(new URL('../package.json', import.meta.url))
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version: string }
const changelogPath = fileURLToPath(new URL('../data/changelog.json', import.meta.url))

function run(cmd: string) {
  console.log(`\n$ ${cmd}`)
  execSync(cmd, { stdio: 'inherit' })
}

// Commit subjects between two refs, newest first, merges and bare version-bump
// commits ("0.1.4") stripped out — shared by the GitHub release notes and the
// changelog entry so the two never drift apart on filtering rules.
function commitMessagesBetween(range: string): string[] {
  const log = execSync(`git log ${range} --oneline --no-merges`).toString().trim()
  if (!log) return []
  return log
    .split('\n')
    .map((line) => line.replace(/^[0-9a-f]+\s+/, ''))
    .filter((msg) => !/^\d+\.\d+\.\d+(-beta\.\d+)?$/.test(msg))
    .filter((msg) => !/^docs: update changelog for v\d+\.\d+\.\d+(-beta\.\d+)?$/i.test(msg))
}

function todayDateString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function inferChangelogType(commits: string[]): ChangelogType {
  if (commits.some((c) => /^feat(\(|:)/i.test(c))) return 'feature'
  if (commits.some((c) => /^fix(\(|:)/i.test(c))) return 'fix'
  return 'improvement'
}

function prependChangelogEntry(entry: ChangelogEntry) {
  const existing = JSON.parse(readFileSync(changelogPath, 'utf-8')) as ChangelogEntry[]
  writeFileSync(changelogPath, JSON.stringify([entry, ...existing], null, 2) + '\n')
}

function inc(major: number, minor: number, patch: number, type: BumpType): string {
  if (type === 'major') return `${major + 1}.0.0`
  if (type === 'minor') return `${major}.${minor + 1}.0`
  return `${major}.${minor}.${patch + 1}`
}

// Mirrors `npm version`'s semver rules so the prompt shows the version npm
// will actually produce. `npmArg` is what gets passed to `npm version`.
export function nextVersion(
  current: string,
  type: BumpType,
  beta: boolean
): { version: string; npmArg: string } {
  const m = current.match(/^(\d+)\.(\d+)\.(\d+)(?:-beta\.(\d+))?$/)
  if (!m) throw new Error(`Unsupported version format: ${current}`)
  const [major, minor, patch] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const betaN = m[4] === undefined ? null : Number(m[4])

  if (beta) {
    // Already on a beta + "patch" → next beta of the same version.
    if (betaN !== null && type === 'patch') {
      return { version: `${major}.${minor}.${patch}-beta.${betaN + 1}`, npmArg: 'prerelease --preid beta' }
    }
    return { version: `${inc(major, minor, patch, type)}-beta.0`, npmArg: `pre${type} --preid beta` }
  }

  // Promoting a beta to stable drops the suffix when the bump is already
  // "contained" in the beta (e.g. 0.6.0-beta.2 + minor → 0.6.0).
  if (
    betaN !== null &&
    (type === 'patch' || (type === 'minor' && patch === 0) || (type === 'major' && minor === 0 && patch === 0))
  ) {
    return { version: `${major}.${minor}.${patch}`, npmArg: type }
  }
  return { version: inc(major, minor, patch, type), npmArg: type }
}

function isGhAvailable(): boolean {
  try {
    execSync('gh --version', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

// GitHub's own --generate-notes is PR-based and comes out nearly empty on repos
// that push directly to a branch instead of merging PRs (this one does) — so
// build notes from the actual commit log between tags instead.
function generateReleaseNotes(fromTag: string, toTag: string): string {
  let messages: string[]
  try {
    messages = commitMessagesBetween(`${fromTag}..${toTag}`)
  } catch {
    console.warn(`Could not diff ${fromTag}..${toTag} — falling back to full history for ${toTag}.`)
    // fromTag doesn't exist locally (e.g. first-ever release) — fall back to full log.
    messages = commitMessagesBetween(toTag)
  }
  if (!messages.length) return `No changes since ${fromTag}.`
  return messages.map((m) => `- ${m}`).join('\n')
}

async function main() {
  console.log(`Current version: ${pkg.version}\n`)

  const previousTag = `v${pkg.version}`
  let commits: string[]
  try {
    commits = commitMessagesBetween(`${previousTag}..HEAD`)
  } catch {
    // previousTag doesn't exist locally (e.g. first-ever release).
    commits = commitMessagesBetween('HEAD')
  }

  const type = await select<ChangelogType>({
    message: 'Release type',
    default: inferChangelogType(commits),
    choices: [
      { name: 'feature', value: 'feature', description: 'A new capability or behavior' },
      { name: 'improvement', value: 'improvement', description: 'An enhancement to something existing' },
      { name: 'fix', value: 'fix', description: 'A bug fix' },
      {
        name: 'beta',
        value: 'beta',
        description: 'Test build — publishes x.y.z-beta.N under the npm "beta" tag, so `latest` is untouched',
      },
    ],
  })
  const isBeta = type === 'beta'
  const alreadyBeta = pkg.version.includes('-beta.')

  const bumpType = await select<BumpType>({
    message: 'Select version bump type',
    choices: [
      {
        name: `${isBeta && alreadyBeta ? 'Next beta' : 'Patch'}  (${pkg.version} → ${nextVersion(pkg.version, 'patch', isBeta).version})`,
        description: isBeta && alreadyBeta ? 'Another beta of the same version' : 'Bug fixes, no breaking changes',
        value: 'patch',
      },
      {
        name: `Minor  (${pkg.version} → ${nextVersion(pkg.version, 'minor', isBeta).version})`,
        description: 'New features, backwards compatible',
        value: 'minor',
      },
      {
        name: `Major  (${pkg.version} → ${nextVersion(pkg.version, 'major', isBeta).version})${isBeta ? '' : '  — stable release'}`,
        description: 'Breaking changes',
        value: 'major',
      },
    ],
  })

  const status = execSync('git status --porcelain').toString().trim()
  if (status) {
    console.log('\nUncommitted changes:')
    console.log(status)
    const proceed = await confirm({
      message: '`npm version` requires a clean working tree (or --allow-same-version). Continue anyway?',
      default: false,
    })
    if (!proceed) {
      console.log('Aborted.')
      process.exit(1)
    }
  }

  const runChecks = await confirm({
    message: 'Run typecheck + build:lib before bumping? (matches prepublishOnly)',
    default: true,
  })
  if (runChecks) {
    run('bun run typecheck')
    run('bun run build:lib')
  }

  const { version: target, npmArg } = nextVersion(pkg.version, bumpType, isBeta)
  const confirmBump = await confirm({
    message: `Bump ${pkg.version} → ${target} (creates a git commit + tag)?`,
    default: true,
  })
  if (!confirmBump) {
    console.log('Aborted.')
    process.exit(1)
  }

  const newTag = `v${target}`

  const doChangelog = await confirm({
    message: `Add a changelog entry for ${newTag} to data/changelog.json?`,
    default: true,
  })
  if (doChangelog) {
    const title = await input({
      message: 'Changelog entry title',
      default: commits[0] ?? target,
      validate: (value) => (value.trim().length > 0 ? true : 'Title is required'),
    })

    prependChangelogEntry({
      version: target,
      date: todayDateString(),
      type,
      title,
      changes: commits.length ? commits : [title],
    })

    run(`git add data/changelog.json`)
    run(`git commit -m "docs: update changelog for ${newTag}"`)
  }

  run(`npm version ${npmArg}`)

  // Prereleases must go out under a non-`latest` dist-tag (npm refuses
  // otherwise), so plain installs never pick up a beta.
  const publishCmd = isBeta ? 'npm publish --tag beta' : 'npm publish'
  const doPublish = await confirm({
    message: `Publish to npm now? (${publishCmd})`,
    default: true,
  })
  if (doPublish) {
    run(publishCmd)
    if (isBeta) console.log(`\nInstall it with: bun add @xk2800/nextjs-template@beta  (or @${target})`)
  } else {
    console.log(`\nSkipped publish. Run when ready:\n  ${publishCmd}`)
  }

  const doPush = await confirm({
    message: 'Push the version commit and tag to origin?',
    default: true,
  })
  let pushed = false
  if (doPush) {
    run('git push')
    run('git push --tags')
    pushed = true
  } else {
    console.log('\nSkipped push. Run when ready:\n  git push && git push --tags')
  }

  const notes = generateReleaseNotes(previousTag, newTag)
  const notesFile = join(tmpdir(), `release-notes-${newTag}.md`)
  writeFileSync(notesFile, notes)

  // A pushed git tag alone does NOT create a GitHub Release — that's a separate
  // object gh release create publishes, referencing the tag.
  if (!isGhAvailable()) {
    console.log(
      `\nGitHub CLI ('gh') not found — skipping release creation. Install it or run manually:\n` +
      `  gh release create ${newTag} --title ${newTag} --notes-file "${notesFile}"${isBeta ? ' --prerelease' : ''}`
    )
  } else if (!pushed) {
    console.log(
      `\nSkipped release creation — ${newTag} isn't on origin yet. Push it first, then run:\n` +
      `  gh release create ${newTag} --title ${newTag} --notes-file "${notesFile}"${isBeta ? ' --prerelease' : ''}`
    )
  } else {
    const doRelease = await confirm({
      message: `Create a GitHub Release for ${newTag}?`,
      default: true,
    })
    if (doRelease) {
      run(`gh release create ${newTag} --title "${newTag}" --notes-file "${notesFile}"${isBeta ? ' --prerelease' : ''}`)
    } else {
      console.log(`\nSkipped release. Run when ready:\n  gh release create ${newTag} --title ${newTag} --notes-file "${notesFile}"${isBeta ? ' --prerelease' : ''}`)
    }
  }
}

// Guarded so the test can import nextVersion() without starting the prompts.
if (import.meta.main) main().catch((err) => {
  // @inquirer/prompts rejects with an Error when the user cancels (Ctrl+C) — exit quietly.
  if (err instanceof Error && err.name === 'ExitPromptError') {
    console.log('\nCancelled.')
    process.exit(130)
  }
  console.error(err)
  process.exit(1)
})
