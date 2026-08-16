import { select, confirm, input } from '@inquirer/prompts'
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

type BumpType = 'patch' | 'minor' | 'major'
type ChangelogType = 'feature' | 'improvement' | 'fix'

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
    .filter((msg) => !/^\d+\.\d+\.\d+$/.test(msg))
    .filter((msg) => !/^docs: update changelog for v\d+\.\d+\.\d+$/i.test(msg))
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

function nextVersion(current: string, type: BumpType): string {
  const [major, minor, patch] = current.split('.').map(Number)
  if (type === 'major') return `${major + 1}.0.0`
  if (type === 'minor') return `${major}.${minor + 1}.0`
  return `${major}.${minor}.${patch + 1}`
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

  const bumpType = await select<BumpType>({
    message: 'Select version bump type',
    choices: [
      {
        name: `Patch  (${pkg.version} → ${nextVersion(pkg.version, 'patch')})`,
        description: 'Bug fixes, no breaking changes',
        value: 'patch',
      },
      {
        name: `Minor  (${pkg.version} → ${nextVersion(pkg.version, 'minor')})`,
        description: 'New features, backwards compatible',
        value: 'minor',
      },
      {
        name: `Major  (${pkg.version} → ${nextVersion(pkg.version, 'major')})  — stable release`,
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

  const target = nextVersion(pkg.version, bumpType)
  const confirmBump = await confirm({
    message: `Bump ${pkg.version} → ${target} (creates a git commit + tag)?`,
    default: true,
  })
  if (!confirmBump) {
    console.log('Aborted.')
    process.exit(1)
  }

  const previousTag = `v${pkg.version}`
  const newTag = `v${target}`

  const doChangelog = await confirm({
    message: `Add a changelog entry for ${newTag} to data/changelog.json?`,
    default: true,
  })
  if (doChangelog) {
    let commits: string[]
    try {
      commits = commitMessagesBetween(`${previousTag}..HEAD`)
    } catch {
      // previousTag doesn't exist locally (e.g. first-ever release).
      commits = commitMessagesBetween('HEAD')
    }

    const type = await select<ChangelogType>({
      message: 'Changelog entry type',
      default: inferChangelogType(commits),
      choices: [
        { name: 'feature', value: 'feature', description: 'A new capability or behavior' },
        { name: 'improvement', value: 'improvement', description: 'An enhancement to something existing' },
        { name: 'fix', value: 'fix', description: 'A bug fix' },
      ],
    })
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

  run(`npm version ${bumpType}`)

  const doPublish = await confirm({
    message: 'Publish to GitHub Packages now? (npm publish)',
    default: true,
  })
  if (doPublish) {
    run('npm publish')
  } else {
    console.log('\nSkipped publish. Run when ready:\n  npm publish')
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
      `  gh release create ${newTag} --title ${newTag} --notes-file "${notesFile}"`
    )
  } else if (!pushed) {
    console.log(
      `\nSkipped release creation — ${newTag} isn't on origin yet. Push it first, then run:\n` +
      `  gh release create ${newTag} --title ${newTag} --notes-file "${notesFile}"`
    )
  } else {
    const doRelease = await confirm({
      message: `Create a GitHub Release for ${newTag}?`,
      default: true,
    })
    if (doRelease) {
      run(`gh release create ${newTag} --title "${newTag}" --notes-file "${notesFile}"`)
    } else {
      console.log(`\nSkipped release. Run when ready:\n  gh release create ${newTag} --title ${newTag} --notes-file "${notesFile}"`)
    }
  }
}

main().catch((err) => {
  // @inquirer/prompts rejects with an Error when the user cancels (Ctrl+C) — exit quietly.
  if (err instanceof Error && err.name === 'ExitPromptError') {
    console.log('\nCancelled.')
    process.exit(130)
  }
  console.error(err)
  process.exit(1)
})
