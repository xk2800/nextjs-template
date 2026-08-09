import { select, confirm } from '@inquirer/prompts'
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

type BumpType = 'patch' | 'minor' | 'major'

const pkgPath = fileURLToPath(new URL('../package.json', import.meta.url))
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version: string }

function run(cmd: string) {
  console.log(`\n$ ${cmd}`)
  execSync(cmd, { stdio: 'inherit' })
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
  const formatCommitLog = (log: string) =>
    log
      .split('\n')
      .map((line) => `- ${line.replace(/^[0-9a-f]+\s+/, '')}`)
      .join('\n')

  try {
    const log = execSync(`git log ${fromTag}..${toTag} --oneline --no-merges`).toString().trim()
    if (!log) return `No changes since ${fromTag}.`
    return formatCommitLog(log)
  } catch {
    console.warn(`Could not diff ${fromTag}..${toTag} — falling back to full history for ${toTag}.`)
    // fromTag doesn't exist locally (e.g. first-ever release) — fall back to full log.
    return formatCommitLog(execSync(`git log ${toTag} --oneline --no-merges`).toString().trim())
  }
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
