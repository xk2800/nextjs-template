import assert from "node:assert/strict"

import { isPushEndpointAllowed as ok, isPushKey } from "../endpoint"

for (const good of [
  "https://fcm.googleapis.com/fcm/send/abc",
  "https://updates.push.services.mozilla.com/wpush/v2/abc",
  "https://web.push.apple.com/abc",
  "https://db5p.notify.windows.com/?token=abc",
]) assert.equal(ok(good), true, good)

for (const bad of [
  "http://fcm.googleapis.com/x",
  "https://internal-service.local/x",
  "https://localhost/x",
  "https://127.0.0.1/x",
  "https://evil.com/fcm.googleapis.com",
  "https://fcm.googleapis.com.evil.com/x",
  "https://evilnotify.windows.com.evil.com/x",
  "https://notify.windows.com.evil.com/x",
  "https://user:pw@fcm.googleapis.com/x",
  "https://fcm.googleapis.com:8443/x",
  "https://fcm.googleapis.com@evil.com/x",
  "not a url",
  "",
]) assert.equal(ok(bad), false, bad)

assert.equal(isPushKey("abc"), true)
assert.equal(isPushKey(""), false)
assert.equal(isPushKey("x".repeat(201)), false)
assert.equal(isPushKey({}), false)

console.log("push-endpoint: ok")
