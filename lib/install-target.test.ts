import assert from "node:assert"
import { detectInstallTarget as d } from "../components/dashboard/installAppCard"

const UA = {
  iphoneSafari: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  iphoneChrome: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.6367.88 Mobile/15E148 Safari/604.1",
  ipadAsMac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  androidChrome: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  androidSamsung: "Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36",
  androidEdge: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36 EdgA/124.0.0.0",
  androidFirefox: "Mozilla/5.0 (Android 14; Mobile; rv:125.0) Gecko/125.0 Firefox/125.0",
  winChrome: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  winEdge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
  winOpera: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 OPR/110.0.0.0",
  macFirefox: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.4; rv:125.0) Gecko/20100101 Firefox/125.0",
}

assert.deepEqual(d(UA.iphoneSafari), { os: "ios", browser: "safari" })
assert.deepEqual(d(UA.iphoneChrome), { os: "ios", browser: "chrome" })
assert.deepEqual(d(UA.ipadAsMac, 5), { os: "ios", browser: "safari" }) // iPadOS desktop UA
assert.deepEqual(d(UA.ipadAsMac, 0), { os: "desktop", browser: "safari" }) // real Mac
assert.deepEqual(d(UA.androidChrome), { os: "android", browser: "chrome" })
assert.deepEqual(d(UA.androidSamsung), { os: "android", browser: "samsung" }) // also says Chrome
assert.deepEqual(d(UA.androidEdge), { os: "android", browser: "edge" })
assert.deepEqual(d(UA.androidFirefox), { os: "android", browser: "firefox" })
assert.deepEqual(d(UA.winChrome), { os: "desktop", browser: "chrome" })
assert.deepEqual(d(UA.winEdge), { os: "desktop", browser: "edge" }) // also says Chrome
assert.deepEqual(d(UA.winOpera), { os: "desktop", browser: "other" }) // also says Chrome
assert.deepEqual(d(UA.macFirefox), { os: "desktop", browser: "firefox" })

console.log("install-target: ok")
