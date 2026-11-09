import { isSubscribed, MARKETING_SEGMENT_ID } from "@xk2800/nextjs-template/marketing"
import MarketingUpdatesCard from "./marketingUpdatesCard"

// Dashboard opt-in for product updates. Renders nothing until
// RESEND_MARKETING_SEGMENT_ID is set.
export default async function MarketingUpdatesSection({ email, emailVerified }: { email: string; emailVerified: boolean }) {
  if (!MARKETING_SEGMENT_ID) return null
  const subscribed = await isSubscribed(email)
  return <MarketingUpdatesCard initialSubscribed={subscribed} emailVerified={emailVerified} />
}
