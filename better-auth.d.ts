/**
 * Better-Auth Type Definitions
 *
 * Extends Better-Auth types with custom user fields
 */

declare module "better-auth/types" {
  interface User {
    role: string
    twoFactorEnabled?: boolean
  }

  interface Session {
    user: User & {
      id: string
      email: string
      name: string
      image?: string
      emailVerified: boolean
    }
  }
}
