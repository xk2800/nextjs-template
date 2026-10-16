import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { CookieBanner, CookieSettingsButton } from "../../components/site/cookie-banner"
import { setCookieConsent } from "../../lib/cookie-consent"
import { ownFrame } from "../_shared"

const meta = {
  title: "Site/CookieBanner",
  component: CookieBanner,
  parameters: { layout: "fullscreen", ...ownFrame(300) },
  // The banner hides once a choice is stored, so start every view fresh.
  beforeEach: () => setCookieConsent(null),
} satisfies Meta<typeof CookieBanner>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
/** Footer link that reopens the banner after a choice was made. */
export const WithSettingsButton: Story = { render: () => <div className="p-4"><CookieSettingsButton /><CookieBanner /></div> }
