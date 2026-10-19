import assert from "node:assert/strict"

import { matchesAccept } from "../components/ui/file-upload"

const file = (name: string, type: string) => new File([""], name, { type })

assert.equal(matchesAccept(file("a.png", "image/png"), "image/*"), true)
assert.equal(matchesAccept(file("a.pdf", "application/pdf"), "image/*"), false)
assert.equal(matchesAccept(file("a.pdf", "application/pdf"), "image/*, application/pdf"), true)
assert.equal(matchesAccept(file("A.HEIC", ""), ".heic"), true)
assert.equal(matchesAccept(file("a.png", "image/png"), "image/jpeg"), false)

console.log("file-upload-accept: ok")
