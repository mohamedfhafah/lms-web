# LMS Web

LMS Web is a Next.js foundation for a learning-management platform. The repository currently focuses on the application skeleton and core infrastructure choices rather than a finished product release.

## Current scope

- Next.js App Router foundation
- Prisma + PostgreSQL wiring
- Clerk authentication dependency setup
- tRPC / React Query dependencies for future typed APIs
- BullMQ / Redis dependencies for background jobs
- Sentry dependency for observability

## Status

This repository is an early-stage scaffold. It is public as a portfolio artifact showing architectural direction and stack selection, not as a production-ready LMS.

## Stack

- Next.js
- React
- TypeScript
- Prisma
- PostgreSQL
- Clerk
- tRPC
- React Query

## Local development

```bash
npm install
npm run dev
```

The default Prisma datasource reads `DATABASE_URL` from your environment.
