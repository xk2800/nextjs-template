import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { FileUpload } from "../../components/ui/file-upload"

const meta = {
  title: "UI/FileUpload",
  component: FileUpload,
  args: { camera: true, gallery: true, dragDrop: true },
} satisfies Meta<typeof FileUpload>
export default meta
type Story = StoryObj<typeof meta>

export const AllMethods: Story = {}
export const GalleryOnly: Story = { args: { camera: false, dragDrop: false } }
export const CameraOnly: Story = { args: { gallery: false, dragDrop: false } }
export const DragDropOnly: Story = { args: { camera: false, gallery: false } }
export const SingleFileMax2MB: Story = { args: { multiple: false, maxSizeMB: 2 } }
export const Disabled: Story = { args: { disabled: true } }
