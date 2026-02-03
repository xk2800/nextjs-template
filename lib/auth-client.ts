import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : undefined
})

// Export commonly used hooks and methods for convenience
export const {
  useSession,
  signIn,
  signOut,
  signUp,
} = authClient
