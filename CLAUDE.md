# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 template using TypeScript, Drizzle ORM, and Better-Auth for authentication. The project supports multiple environments (development, production, test) with separate database configurations for each.

**Tech Stack:**
- Next.js 15.3.3 with App Router
- React 19
- TypeScript
- Drizzle ORM for database management
- Better-Auth 1.3.34 for authentication
- PostgreSQL (self-hosted for dev, Neon DB for production)
- Bun as package manager and runtime
- Tailwind CSS 4 + Shadcn/ui components

## Key Commands

### Development
```bash
bun install                # Install dependencies
bun dev                    # Start dev server with Turbopack
bun run lint              # Run ESLint
```

### Database Management
```bash
bun run generate          # Generate Drizzle migrations from schema (works for all environments)
bun run migrate:dev       # Run migrations against development database
bun run migrate:prod      # Run migrations against production database
bun run migrate:test      # Run migrations against test database
bun run studio:dev        # Open Drizzle Studio for development database
bun run studio:prod       # Open Drizzle Studio for production database
```

### Secrets via Doppler (optional alternative to `.env.*` files)

```bash
doppler login && doppler setup   # one-time, per machine
bun run dev:doppler
bun run build:doppler
bun run start:doppler
bun run generate:doppler
bun run migrate:doppler
bun run studio:doppler
```

`doppler run --` injects secrets into `process.env` before the command starts — no code changes needed, `config/env.ts` and `drizzle.config.ts` just read `process.env` regardless of source. See README's "Secrets management with Doppler" section for setup details.

### Testing Database Connection
```bash
bun --env-file=.env.development server/test-connection/index.ts
bun --env-file=.env.production server/test-connection/index.ts
```

### Password Migration (if migrating from NextAuth)
```bash
bun --env-file=.env.development scripts/migrate-passwords.ts
```

### Build & Deploy
```bash
bun run build            # Build for production
bun start                # Start production server
```

## Architecture

### Authentication (Better-Auth)

The authentication system is centralized in `server/auth.ts` and uses Better-Auth with:

- **Providers:**
  - Google OAuth
  - Email & Password (credentials) with bcrypt password hashing

- **Session Strategy:** Database-backed sessions with 30-day expiration
  - Session cookies are cached for 5 minutes for performance (hybrid approach)
  - Sessions automatically updated every 24 hours

- **Database Adapter:** Better-Auth Drizzle adapter connected to PostgreSQL

- **User Fields:** Custom fields include:
  - `id`, `role`, `name`, `email`, `image`, `emailVerified`
  - Role defaults to "user" and cannot be set by users directly

- **API Route:** Auth handlers exposed via `app/api/auth/[...all]/route.ts`

**Important Auth Details:**
- User passwords are stored in the `accounts` table with `providerId: "credential"`
- Passwords are hashed with bcrypt (10 rounds) before storage
- OAuth accounts are stored in `accounts` table with provider-specific IDs
- Sessions are database-backed (not JWT-only like NextAuth v5)

**Server-Side Session Access:**
```typescript
import { auth } from "@/server/auth"
import { headers } from "next/headers"

const session = await auth.api.getSession({
  headers: await headers()
})
// Returns { session, user } or { session: null, user: null }
```

**Client-Side Usage:**
```typescript
import { authClient, useSession } from "@/lib/auth-client"

// In components
const { data: session, isPending } = useSession()

// Sign in
await authClient.signIn.email({ email, password })
await authClient.signIn.social({ provider: "google", callbackURL: "/" })

// Sign out
await authClient.signOut()
```

### Database Architecture

**Schema Location:** `server/db/schema.ts`

**Tables:**
- `users`: Main user table with id (cuid2), name, email, emailVerified (boolean), image, role (enum: user/admin), timestamps
- `accounts`: OAuth and credential account storage
  - Contains: accountId, providerId, userId, password (for credentials), OAuth tokens, timestamps
- `sessions`: Database-backed sessions
  - Contains: id, token, expiresAt, userId, ipAddress, userAgent, timestamps
- `verifications`: Email verification and password reset tokens
  - Contains: id, identifier, value, expiresAt, timestamps

**Database Connection:**
- Configured via `server/db/index.ts`
- Uses `@neondatabase/serverless` driver
- Connection URL managed through environment-specific config

**Drizzle Configuration:**
- Config file: `drizzle.config.ts`
- Migrations output: `server/drizzle/`
- Schema file: `server/db/schema.ts`

### Environment Configuration

**Location:** `config/env.ts`

Uses Zod for environment validation with schema:
- `NODE_ENV`: 'development' | 'production' | 'test'
- `PORT`: Number (default: 3000)
- `DATABASE_URL`: Connection string

**Environment Files:**
- `.env.development` - Local PostgreSQL
- `.env.production` - Neon DB
- `.env.test` - Test database
- Examples provided with `.example` suffix

**Required Auth Environment Variables:**
- `AUTH_SECRET` - Better-Auth secret for signing cookies and tokens
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` - Google OAuth credentials
- `BETTER_AUTH_URL` - Base URL for auth callbacks (e.g., http://localhost:3000)
- `NEXT_PUBLIC_APP_URL` - Client-side base URL for auth client

### File Structure

```
server/
  ├── db/
  │   ├── schema.ts          # Drizzle schema definitions
  │   └── index.ts           # Database connection
  ├── drizzle/               # Generated migrations
  ├── auth.ts                # Better-Auth configuration
  └── test-connection/       # Database connection test scripts

scripts/
  └── migrate-passwords.ts   # Password migration utility (NextAuth → Better-Auth)

app/
  ├── (auth)/login/          # Login page
  ├── api/auth/[...all]/     # Better-Auth API routes
  └── ...                    # Other app routes

components/
  ├── auth/                  # Auth-related components
  │   ├── components/
  │   │   ├── authCard.tsx
  │   │   └── socialLogin.tsx
  │   └── logoutButtons.tsx
  └── ui/                    # Shadcn/ui components

lib/
  ├── auth-client.ts         # Better-Auth React client configuration
  └── utils.ts               # Utility functions

types/
  └── (auth)/
      └── loginSchema.ts     # Zod schema for login validation

config/
  └── env.ts                 # Environment variable validation

better-auth.d.ts             # Better-Auth type extensions
```

### TypeScript Configuration

- Path alias: `@/*` maps to project root
- Target: ES2017
- Module resolution: bundler (Next.js style)

## Development Workflow

1. **Environment Setup:**
   - Copy `.env.*.example` files to create your environment files
   - Fill in database URLs and auth credentials
   - Set `AUTH_SECRET` (generate with: `openssl rand -base64 32`)

2. **Database Changes:**
   - Modify `server/db/schema.ts`
   - Run `bun run generate` to create migration
   - Run `bun run migrate:dev` (or appropriate environment) to apply

3. **Authentication Changes:**
   - Modify `server/auth.ts` for provider/callback changes
   - Update `server/db/schema.ts` if user/account schema changes
   - Update `better-auth.d.ts` if adding custom user fields
   - Client components use `@/lib/auth-client` for auth operations

## Better-Auth Key Concepts

**Session Management:**
- Better-Auth uses database-backed sessions (not stateless JWT)
- Sessions are stored in the `session` table
- Cookie caching provides performance optimization (5-minute cache)
- All existing sessions invalidate when switching from NextAuth

**Password Storage:**
- Passwords are stored in the `accounts` table, not `users` table
- Each password has `providerId: "credential"` and `accountId: <user-email>`
- Bcrypt hashing is used for compatibility

**Account Linking:**
- Multiple auth methods can link to same user via `accounts` table
- OAuth providers create separate account records
- Email/password creates credential account record

**Plugin Architecture:**
- Better-Auth uses plugins for extended features (2FA, magic links, etc.)
- Core functionality is lightweight by design
- Refer to Better-Auth docs for available plugins

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
