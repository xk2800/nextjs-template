import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters long.',
  }),
  // name: z.string().min(1, {
  //   message: 'Name should be at least 1 character long.'
  // })
})