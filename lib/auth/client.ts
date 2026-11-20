import { createAuthClient } from "better-auth/react"
import { oneTapClient, adminClient, twoFactorClient } from "better-auth/client/plugins"
import { passkeyClient } from "@better-auth/passkey/client"

const oneTapEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLE_ONE_TAP === "true"

// better-auth's One Tap plugin calls navigator.credentials.preventSilentAccess() after
// sign-out without handling the promise. It rejects wherever the browser can't reach
// its credential service (headless/automated browsers, some privacy setups), surfacing
// as an unhandled rejection. Same hook, with the rejection swallowed.
function withSafeFedCMSignOut<T extends ReturnType<typeof oneTapClient>>(plugin: T): T {
  plugin.fetchPlugins = plugin.fetchPlugins?.map((p) =>
    p.id !== "fedcm-signout-handle" ? p : {
      ...p,
      hooks: {
        async onResponse(ctx) {
          if (!ctx.request.url.toString().includes("/sign-out")) return
          if (!("IdentityCredential" in window)) return
          await navigator.credentials.preventSilentAccess().catch(() => {})
        },
      },
    },
  )
  return plugin
}

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : undefined,

  plugins: [
    adminClient(),
    twoFactorClient(),
    passkeyClient(),
    ...(oneTapEnabled ? [
      withSafeFedCMSignOut(oneTapClient({
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
      }))
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
