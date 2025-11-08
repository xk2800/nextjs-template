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
2. Shadcn/ui
3. NextAuth with Google OAuth
4. Basic login flow using NextAuth
5. Connection template to a postgresql database for development, testing and production

## WIP

1. Migrating NextAuth to BetterAuth
