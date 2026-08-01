import { z } from "zod";

export const SignupSchema = z.object({
  name: z.string().min(1, {
    message: 'Name is required.',
  }),
  email: z.string().email(),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters long.',
  }),
})
