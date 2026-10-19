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
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { name: string; version: string }
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

function parse(v: string) {
  const m = v.match(/^(\d+)\.(\d+)\.(\d+)(?:-beta\.(\d+))?$/)
  if (!m) return null
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]), beta: m[4] === undefined ? null : Number(m[4]) }
}

function compareStable(a: string, b: string) {
  const [x, y] = [parse(a)!, parse(b)!]
  return x.major - y.major || x.minor - y.minor || x.patch - y.patch
}

// `existing` is every version already released (git tags + npm). Stable
// releases bump from the latest *stable* version, so 0.6.0 + minor is 0.7.0
// even while 0.8.0-beta.N exists. Betas skip numbers that are already taken.
export function nextVersion(current: string, type: BumpType, beta: boolean, existing: string[] = []): string {
  const cur = parse(current)
  if (!cur) throw new Error(`Unsupported version format: ${current}`)

  if (beta) {
    // Already on a beta + "patch" → next beta of the same version.
    const base = cur.beta !== null && type === 'patch'
      ? `${cur.major}.${cur.minor}.${cur.patch}`
      : inc(cur.major, cur.minor, cur.patch, type)
    const taken = existing.flatMap((v) => (v.startsWith(`${base}-beta.`) ? [parse(v)?.beta ?? -1] : []))
    const n = Math.max(cur.beta !== null && type === 'patch' ? cur.beta + 1 : 0, ...taken.map((t) => t + 1))
    return `${base}-beta.${n}`
  }

  const stables = [...existing, current].filter((v) => parse(v)?.beta === null).sort(compareStable)
  const latest = stables.at(-1)
  let version: string
  if (latest) {
    const s = parse(latest)!
    version = inc(s.major, s.minor, s.patch, type)
  } else if (type === 'patch' || (type === 'minor' && cur.patch === 0) || (type === 'major' && cur.minor === 0 && cur.patch === 0)) {
    // No stable release yet: promote the beta when the bump is "contained" in it.
    version = `${cur.major}.${cur.minor}.${cur.patch}`
  } else {
    version = inc(cur.major, cur.minor, cur.patch, type)
  }
  return version
}

// Versions already out: local git tags plus whatever npm has (if reachable).
function releasedVersions(name: string): string[] {
  const tags = execSync('git tag --list "v*"').toString().split('\n').map((t) => t.trim().replace(/^v/, ''))
  let published: string[] = []
  try {
    published = JSON.parse(execSync(`npm view ${name} versions --json`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString())
  } catch {
    console.warn('Could not read published versions from npm — using git tags only.')
  }
  return [...new Set([...tags, ...published])].filter((v) => parse(v))
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
  console.log(`Current version: ${pkg.version}`)
  const existing = releasedVersions(pkg.name)
  const latestStable = existing.filter((v) => parse(v)?.beta === null).sort(compareStable).at(-1)
  console.log(`Latest stable: ${latestStable ?? 'none'}\n`)

  const commitsSince = (tag: string) => {
    try {
      return commitMessagesBetween(`${tag}..HEAD`)
    } catch {
      // tag doesn't exist locally (e.g. first-ever release).
      return commitMessagesBetween('HEAD')
    }
  }
  let previousTag = `v${pkg.version}`
  let commits = commitsSince(previousTag)

  const alreadyBeta = pkg.version.includes('-beta.')
  const base = pkg.version.replace(/-beta\.\d+$/, '')
  // Only a beta has an "existing" version to continue: its next beta.
  const nextBeta = nextVersion(pkg.version, 'patch', true, existing)
  const mode = alreadyBeta
    ? await select<'existing' | 'new'>({
        message: 'Bump existing version or create a new one?',
        choices: [
          { name: `Bump existing  (${pkg.version} → ${nextBeta})`, value: 'existing', description: `Next ${base} beta` },
          { name: 'Create new version', value: 'new', description: 'Pick a release type and patch / minor / major bump' },
        ],
      })
    : 'new'

  const type = mode === 'existing' ? 'beta' : await select<ChangelogType>({
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

  // A stable release covers everything since the last stable one.
  if (!isBeta && latestStable) {
    previousTag = `v${latestStable}`
    commits = commitsSince(previousTag)
  }

  // A new beta starts its own line from the beta's base (0.7.1-beta.1 + patch →
  // 0.7.2-beta.0); "Next beta" of the same version is the "existing" path.
  const fromVersion = isBeta ? base : pkg.version
  const from = isBeta ? base : (latestStable ?? pkg.version)
  const option = (t: BumpType, label: string, description: string, suffix = '') => ({
    name: `${label}  (${from} → ${nextVersion(fromVersion, t, isBeta, existing)})${suffix}`,
    description,
    value: t,
  })

  let target: string
  if (mode === 'existing') {
    target = nextBeta
  } else {
    const bumpType = await select<BumpType>({
      message: 'Select version bump type',
      choices: [
        option('patch', 'Patch', 'Bug fixes, no breaking changes'),
        option('minor', 'Minor', 'New features, backwards compatible'),
        option('major', 'Major', 'Breaking changes', isBeta ? '' : '  — stable release'),
      ],
    })
    target = nextVersion(fromVersion, bumpType, isBeta, existing)
  }

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

  // Explicit version: npm's own `minor`/`patch` would bump from the beta in
  // package.json, not from the latest stable.
  run(`npm version ${target}`)

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
