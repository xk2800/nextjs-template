import { isSubscribed } from "@/lib/marketing-subscription"
import MarketingUpdatesCard from "./marketingUpdatesCard"

export default async function MarketingUpdatesSection({ email, emailVerified }: { email: string; emailVerified: boolean }) {
  const subscribed = await isSubscribed(email)
  return <MarketingUpdatesCard initialSubscribed={subscribed} emailVerified={emailVerified} />
}
