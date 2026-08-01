import { select, confirm } from '@inquirer/prompts'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
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

  run(`npm version ${bumpType}`)

  const doPublish = await confirm({
    message: 'Publish to GitHub Packages now? (npm publish)',
    default: false,
  })

  if (doPublish) {
    run('npm publish')

    const doPush = await confirm({
      message: 'Push the version commit and tag to origin?',
      default: true,
    })
    if (doPush) {
      run('git push')
      run('git push --tags')
    } else {
      console.log('\nSkipped push. Run when ready:\n  git push && git push --tags')
    }
  } else {
    console.log('\nSkipped publish. When ready:\n  npm publish\n  git push && git push --tags')
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
