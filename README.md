This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

This is a template for Next.js projects using Drizzle ORM, self hosted PostgreSQL for development and Neon DB for production.

## Getting Started

1. Install the packages:

```bash
bun install
```

2. Setup the `.env.development` and `.env.production` files based on `.env.development.example` and `.env.production.example` respectively.

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
bun --env-file=.env.development server/test-connection/index.ts
```
