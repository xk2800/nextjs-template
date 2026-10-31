import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Input } from "../../components/ui/input"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "../../components/ui/field"

/** Form layout primitives: label, control, description and error, laid out consistently. */
const meta = {
  title: "UI/Field",
  component: Field,
} satisfies Meta<typeof Field>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Field {...args} className="max-w-sm">
      <FieldLabel htmlFor="email">Email</FieldLabel>
      <Input id="email" placeholder="you@example.com" />
      <FieldDescription>We&apos;ll never share it.</FieldDescription>
    </Field>
  ),
}

/** Pass `data-invalid` on `Field` and `aria-invalid` on the control; `FieldError` takes `errors` (e.g. from react-hook-form). */
export const Invalid: Story = {
  render: (args) => (
    <Field {...args} data-invalid className="max-w-sm">
      <FieldLabel htmlFor="amount">Amount</FieldLabel>
      <Input id="amount" type="number" aria-invalid />
      <FieldError errors={[{ message: "Amount must be greater than 0" }]} />
    </Field>
  ),
}

export const Horizontal: Story = {
  render: (args) => (
    <Field {...args} orientation="horizontal" className="max-w-sm">
      <FieldLabel htmlFor="name">Name</FieldLabel>
      <Input id="name" />
    </Field>
  ),
}

export const FieldSetGroup: Story = {
  render: () => (
    <FieldSet className="max-w-sm">
      <FieldLegend>Billing address</FieldLegend>
      <FieldGroup>
        <Field><FieldLabel htmlFor="street">Street</FieldLabel><Input id="street" /></Field>
        <Field><FieldLabel htmlFor="city">City</FieldLabel><Input id="city" /></Field>
      </FieldGroup>
    </FieldSet>
  ),
}
