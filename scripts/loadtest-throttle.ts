// Hammer the per-device sign-in throttle and tally HTTP status codes.
// Usage: bun scripts/loadtest-throttle.ts [total=30] [concurrency=1] [fingerprint]
//   bun scripts/loadtest-throttle.ts 30 1          # sequential: clean 10x401 then 429s
//   bun scripts/loadtest-throttle.ts 100 25        # burst: shows the window race tolerance
//   bun scripts/loadtest-throttle.ts 30 1 my-fp    # reuse a fixed fingerprint across runs
//
// Target defaults to http://localhost:3000 (override with LOADTEST_URL).
// Run against `bun dev` — better-auth's own IP rate-limiter is off in dev,
// on in a production build, and would muddy the result.

export {} // make this a module so top-level await type-checks

const BASE = process.env.LOADTEST_URL ?? "http://localhost:3000"
const total = Number(process.argv[2] ?? 30)
const concurrency = Number(process.argv[3] ?? 1)
const fingerprint = process.argv[4] ?? `loadtest-${Date.now()}`

async function attempt() {
  const res = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-device-fingerprint": fingerprint,
    },
    body: JSON.stringify({ email: "loadtest@example.com", password: "wrong-password" }),
  })
  await res.text() // drain
  return res.status
}

const counts: Record<number, number> = {}
const latencies: number[] = []
const queue = Array.from({ length: total }, (_, i) => i)

async function worker() {
  while (queue.length) {
    queue.shift()
    const t = performance.now()
    const status = await attempt()
    latencies.push(performance.now() - t)
    counts[status] = (counts[status] ?? 0) + 1
  }
}

const t0 = performance.now()
await Promise.all(Array.from({ length: concurrency }, worker))
const ms = Math.round(performance.now() - t0)

latencies.sort((a, b) => a - b)
const p50 = Math.round(latencies[Math.floor(latencies.length * 0.5)])
const p95 = Math.round(latencies[Math.floor(latencies.length * 0.95)])

console.log(`fingerprint : ${fingerprint}`)
console.log(`requests    : ${total} in ${ms}ms @ ${concurrency} concurrent`)
console.log(`latency     : p50 ${p50}ms  p95 ${p95}ms`)
console.table(counts)
console.log(
  "expect: 401 x MAX (10), then 429 for the rest.\n" +
  "        bcrypt makes the 401s slow (~50-100ms); 429s are a single indexed SELECT and fast.\n" +
  "        high concurrency leaks a few extra 401s past 10 — tumbling-window race, see the\n" +
  "        `ponytail:` note in lib/auth-throttle.ts.\n" +
  "cleanup: DELETE FROM auth_throttle WHERE fingerprint LIKE 'loadtest-%';",
)
