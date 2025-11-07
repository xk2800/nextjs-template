This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

This is a template for Next.js projects using Drizzle ORM, self hosted PostgreSQL for development and Neon DB for production.

## Basic Folder Structure

```plaintext {5}
📦 <project root>
├── 📂 server/
│   ├── 📂 db/
│   │   ├── 📜 schema.ts
│   │   └── 📜 index.ts
│   ├── 📂 drizzle/
│   ├── 📜 auth.ts
│   └── 📂 test-connection/
│       └── 📜 index.ts
├── 📂 scripts/
│   └── 📜 migrate-passwords.ts
├── 📜 .env.production
├── 📜 .env.development
├── 📜 drizzle.config.ts
├── 📜 package.json
└── 📜 tsconfig.json
```

## Getting Started

1. Install the packages:

```bash
bun install
```

2. Setup the `.env.development` and `.env.production` files based on `.env.development.example` and `.env.production.example` respectively.

   **Important:** Generate an `AUTH_SECRET` using:
   ```bash
   openssl rand -base64 32
   ```

## Migrating Schema

1. Generating schema, running this one command works for development and production modes `bun run generate`

2. Migrating schema into:

```bash
# development
bun run migrate:dev

# production
bun run migrate:prod
```

## Testing Connection

1. To test and ensure that the connection and database works, run:

```bash
# development
bun --env-file=.env.development server/test-connection/index.ts

# production
bun --env-file=.env.production server/test-connection/index.ts
```

## Features

1. Basic Next.js + Tailwind CSS boilerplate
2. Shadcn/ui components
3. Better-Auth with Google OAuth
4. Email/password authentication with bcrypt
5. Database-backed sessions with cookie caching
6. Connection template to a postgresql database for development, testing and production

## Authentication

This template uses [Better-Auth](https://www.better-auth.com) for authentication with:

- Google OAuth provider
- Email/password authentication
- Database-backed sessions (30-day expiration)
- Bcrypt password hashing
- Role-based access control (user/admin)

### Auth Setup

1. Configure Google OAuth credentials in your `.env` file:
   ```
   AUTH_GOOGLE_ID=your-google-client-id
   AUTH_GOOGLE_SECRET=your-google-client-secret
   ```

2. Set the base URL for auth callbacks:
   ```
   BETTER_AUTH_URL=http://localhost:3000
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. Authentication routes are available at `/api/auth/*`

### Usage Examples

**Server-side (Server Components/API Routes):**
```typescript
import { auth } from "@/server/auth"
import { headers } from "next/headers"

const session = await auth.api.getSession({
  headers: await headers()
})
```

**Client-side (Client Components):**
```typescript
import { authClient, useSession } from "@/lib/auth-client"

// Get session
const { data: session, isPending } = useSession()

// Sign in with email/password
await authClient.signIn.email({ email, password })

// Sign in with Google
await authClient.signIn.social({ provider: "google", callbackURL: "/" })

// Sign out
await authClient.signOut()
```
