import { createAuthClient } from "better-auth/react"
import { oneTapClient, adminClient, twoFactorClient } from "better-auth/client/plugins"
import { passkeyClient } from "@better-auth/passkey/client"

const oneTapEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLE_ONE_TAP === "true"

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : undefined,

  plugins: [
    adminClient(),
    twoFactorClient(),
    passkeyClient(),
    ...(oneTapEnabled ? [
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
      })
    ] : []),
  ]
})

// Export commonly used hooks and methods for convenience
export const {
  useSession,
  signIn,
  signOut,
  signUp,
} = authClient
