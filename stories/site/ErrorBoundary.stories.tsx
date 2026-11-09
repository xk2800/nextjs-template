import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ErrorBoundary } from "../../components/error-boundary"

function Boom(): never {
  throw new Error("Story error")
}

const meta = {
  title: "Site/ErrorBoundary",
  component: ErrorBoundary,
  args: { fallback: <p className="text-sm text-destructive">Fallback rendered: a child threw.</p>, children: <p>Children rendered fine.</p> },
} satisfies Meta<typeof ErrorBoundary>
export default meta
type Story = StoryObj<typeof meta>

export const Healthy: Story = {}
export const ChildThrows: Story = { args: { children: <Boom /> } }
