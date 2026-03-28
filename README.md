# LMS-Web

LMS-Web is a web-based library management system built with Next.js, Prisma, tRPC, Clerk authentication, and background jobs for reservations and reminders.

## Features

- catalogue and work detail pages
- loan and reservation workflows
- admin pages for managing library data
- Prisma-backed persistence layer
- Redis/BullMQ jobs for reservation expiry and reminder workflows

## Tech Stack

- Next.js 15
- React 19
- Prisma + PostgreSQL
- Clerk
- tRPC
- BullMQ / Redis
- Vitest

## Prerequisites

- Node.js 20+
- PostgreSQL
- Redis-compatible queue backend

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the example environment file and fill in your local values:

```bash
cp .env.example .env
```

3. Apply the database schema and seed local data if needed:

```bash
npx prisma migrate dev
npx prisma db seed
```

## Development

Start the local development server:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Validation

Use the built-in checks before pushing changes:

```bash
npm run typecheck
npm run test
npm run build
```

## Environment Notes

The repository ships an [.env.example](./.env.example) file with the expected variables for:

- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `RESEND_API_KEY`

## Repository Layout

- `src/` application UI and routes
- `server/` tRPC routers, jobs, and server logic
- `prisma/` schema, migrations, and seed data

## Status

This repository is actively developed. If the working tree is dirty locally, rely on the commands above to validate your own branch before publishing.
