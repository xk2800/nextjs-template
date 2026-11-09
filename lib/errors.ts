import "server-only"
import { randomBytes } from "node:crypto"
import { after } from "next/server"
import { eq, lt } from "drizzle-orm"
import { db } from "../server/db"
import { errorRefs } from "../server/db/schema"

// No 0/O/1/I so a user can read a ref back without mix-ups.
const REF_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
const REF_PATTERN = /\(ref: ([2-9A-HJ-NP-Z]{6})\)/
const DETAIL_MAX_LENGTH = 8000
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000

function describeError(error: unknown): string {
  if (error instanceof Error) return error.stack || `${error.name}: ${error.message}`
  try {
    return JSON.stringify(error, null, 2)
  } catch {
    return String(error)
  }
}

// Saves the detail so a later feedback report can carry it. Runs after the
// response when inside a request (after()), and never fails the caller.
function storeDetail(ref: string, message: string, error: unknown) {
  const save = async () => {
    try {
      await db.insert(errorRefs).values({
        ref,
        message,
        detail: describeError(error).slice(0, DETAIL_MAX_LENGTH),
      })
      // ponytail: prune on insert; a scheduled cleanup if error volume ever gets high.
      await db.delete(errorRefs).where(lt(errorRefs.createdAt, new Date(Date.now() - RETENTION_MS)))
    } catch (storeError) {
      console.error(`[error ref ${ref}] could not store error detail`, storeError)
    }
  }
  try {
    after(save)
  } catch {
    void save() // outside a request scope (e.g. a script)
  }
}

/** The stored technical detail for the ref inside a user-facing error message, if any. */
export async function lookupErrorDetail(text: string): Promise<string | null> {
  const ref = text.match(REF_PATTERN)?.[1]
  if (!ref) return null
  const [row] = await db
    .select({ detail: errorRefs.detail })
    .from(errorRefs)
    .where(eq(errorRefs.ref, ref))
    .limit(1)
  return row?.detail ?? null
}

/**
 * Logs an unexpected error under a short reference and returns the message to
 * show instead, e.g. "Failed to update role (ref: K7Q2PX)". The user, and any
 * feedback report they send, only ever get the ref. The error itself goes to
 * the server log ("error ref K7Q2PX") and the error_refs table, from which the
 * feedback route attaches it to reports sent to Discord/email.
 */
export function unexpectedErrorMessage(
  error: unknown,
  message = "Something went wrong. Please try again."
): string {
  const ref = Array.from(randomBytes(6), (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join("")
  console.error(`[error ref ${ref}] ${message}`, error)
  storeDetail(ref, message, error)
  return `${message} (ref: ${ref})`
}

/**
 * Throw this for messages that are safe to show to the end user (validation,
 * permission, and state-conflict errors). Anything else thrown inside a
 * `withActionErrors`-wrapped action is logged server-side and replaced with a
 * generic message carrying an error ref.
 */
export class ActionError extends Error {}

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string }

function isFrameworkControlFlowError(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest
  return (
    typeof digest === "string" &&
    (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK"))
  )
}

/** Wraps a server action so it returns an ActionResult instead of throwing. */
export function withActionErrors<Args extends unknown[], T>(
  action: (...args: Args) => Promise<T>
): (...args: Args) => Promise<ActionResult<T>> {
  return async (...args: Args): Promise<ActionResult<T>> => {
    try {
      return { ok: true, data: await action(...args) }
    } catch (error) {
      if (error instanceof ActionError) {
        return { ok: false, message: error.message }
      }
      if (isFrameworkControlFlowError(error)) {
        throw error
      }
      // Returned, not thrown: Next.js replaces thrown server-action messages
      // in production, which would drop the ref.
      return { ok: false, message: unexpectedErrorMessage(error) }
    }
  }
}
