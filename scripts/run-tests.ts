// Runs every *.test.ts the repo tracks (plus new, not-yet-committed ones), one
// bun process each since they are plain assert scripts. git decides the list, so
// node_modules, docs and build output can never match, and a new test can't be
// forgotten from a hand-kept chain.
const list = Bun.spawnSync(["git", "ls-files", "-co", "--exclude-standard", "*.test.ts"])
const files = list.stdout.toString().split("\n").filter(Boolean).sort()
if (list.exitCode !== 0 || files.length === 0) {
  console.error("run-tests: found no *.test.ts files (is this a git checkout?)")
  process.exit(1)
}

const failed: string[] = []
for (const file of files) {
  const { exitCode } = Bun.spawnSync(["bun", file], { stdout: "inherit", stderr: "inherit" })
  if (exitCode !== 0) failed.push(file)
}

console.log(`\n${files.length - failed.length}/${files.length} test files passed`)
if (failed.length) {
  console.error(`FAILED:\n  ${failed.join("\n  ")}`)
  process.exit(1)
}
