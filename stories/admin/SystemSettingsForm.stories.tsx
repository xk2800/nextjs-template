import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import SystemSettingsForm from "../../components/dashboard/admin/systemSettingsForm"
import { mockSettings } from "../../.storybook/mocks"

const meta = {
  title: "Admin/SystemSettingsForm",
  component: SystemSettingsForm,
  args: { initialSettings: mockSettings, configuredFlags: { google: true, emailPassword: true, oneTap: false } },
} satisfies Meta<typeof SystemSettingsForm>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const MaintenanceOn: Story = { args: { initialSettings: { ...mockSettings, maintenanceMode: true, maintenanceMessage: "Back in 10 minutes." } } }
/** Providers disabled in env can't be switched on from the UI. */
export const ProvidersNotConfigured: Story = { args: { configuredFlags: { google: false, emailPassword: true, oneTap: false } } }
