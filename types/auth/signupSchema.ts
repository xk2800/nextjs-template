import { z } from "zod";

export const SignupSchema = z.object({
  name: z.string().min(1, {
    message: 'Name is required.',
  }),
  email: z.string().email(),
  // Matches better-auth's default minPasswordLength (server/auth.ts doesn't
  // override it) — was 6 here, which let the client accept passwords the
  // server would then reject.
  password: z.string().min(8, {
    message: 'Password must be at least 8 characters long.',
  }),
})
