import { createAuthClient } from "better-auth/react"
import { passkeyClient } from "@better-auth/passkey/client"

export const authClient = createAuthClient({
  // window.location.origin is undefined during SSR, so we skip it and let
  // Better Auth fall back to its own origin detection on the server
  baseURL: typeof window !== "undefined" ? window.location.origin : undefined,
  // passkeyClient adds signIn.passkey, passkey.addPasskey, passkey.listUserPasskeys, etc.
  plugins: [passkeyClient()],
})

export const {
  useSession,
  signIn,
  signOut,
  signUp,
  passkey,
} = authClient
