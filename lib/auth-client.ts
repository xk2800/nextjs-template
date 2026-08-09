import { createAuthClient } from "better-auth/react"
import { oneTapClient, adminClient } from "better-auth/client/plugins"
import type { BetterAuthClientPlugin } from "better-auth/client"

const oneTapEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLE_ONE_TAP === "true"

// Derived (not hand-written) from the plugin's own return type, so it tracks
// whatever better-auth version is actually installed by the consumer.
type OneTapActions = ReturnType<ReturnType<typeof oneTapClient>["getActions"]>

const baseAuthClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : undefined,

  plugins: [
    adminClient(),
    ...(oneTapEnabled ? [
      // On newer better-auth versions (>=1.6, within our ^1.3.34 range) the
      // one-tap plugin's `getActions` signature doesn't structurally satisfy
      // `BetterAuthClientPlugin` (a generic-variance mismatch upstream), so
      // it can't be assigned into this array as-is. Widen it here —
      // `.oneTap` is added back to `authClient`'s type below via
      // `OneTapActions`, independent of this array's inferred plugin type.
      oneTapClient({
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
        // Optional client configuration:
        autoSelect: false,
        cancelOnTapOutside: true,
        context: "signin",
        additionalOptions: {
          // Any extra options for the Google initialize method
        },
        // Configure prompt behavior and exponential backoff:
        promptOptions: {
          baseDelay: 1000,   // Base delay in ms (default: 1000)
          maxAttempts: 5     // Maximum number of attempts before triggering onPromptNotification (default: 5)
        }
      }) as unknown as BetterAuthClientPlugin
    ] : []),
  ]
})

// createAuthClient can't narrow `Option["plugins"]` from a conditional spread,
// so it loses the one-tap plugin's action types. Add `.oneTap` back here
// instead of forcing the plugin into the array unconditionally — doing that
// trips a getActions variance mismatch against BetterAuthClientPlugin on
// newer better-auth versions (>=1.6). The env check above still fully gates
// whether the plugin (and thus `.oneTap`) is registered at runtime.
export const authClient = baseAuthClient as typeof baseAuthClient & OneTapActions

// Export commonly used hooks and methods for convenience
export const {
  useSession,
  signIn,
  signOut,
  signUp,
} = authClient
