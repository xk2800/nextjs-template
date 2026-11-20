import assert from "node:assert/strict"

import { pgSslOptions } from "../pg-ssl"

delete process.env.DATABASE_SSL_CA
delete process.env.DATABASE_SSL_INSECURE
assert.deepEqual(pgSslOptions(), { rejectUnauthorized: true }) // verifies by default

process.env.DATABASE_SSL_CA = "-----BEGIN-----\\nabc\\n-----END-----"
assert.deepEqual(pgSslOptions(), { rejectUnauthorized: true, ca: "-----BEGIN-----\nabc\n-----END-----" })

process.env.DATABASE_SSL_INSECURE = "true"
assert.deepEqual(pgSslOptions(), { rejectUnauthorized: false })

console.log("pg-ssl: ok")
