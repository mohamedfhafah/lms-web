# Operations: Background Jobs, Email, and Scheduling

This document summarizes the operational setup for overdue reminders and reservation expiry jobs.

## Environment Variables

- RESEND_API_KEY: Resend API key (required for sending emails)
- RESEND_FROM: Sender email address (defaults to onboarding@resend.dev)
- JOB_SECRET: Shared secret required by job HTTP endpoints
- ENABLE_BULL_WORKER: Set to "false" in local dev to disable BullMQ/Redis (default: true)
- UPSTASH_REDIS_URL: Redis URL for BullMQ workers/queues (required in prod when worker enabled)

Set locally in .env.local and in Vercel project settings for production.

## HTTP Job Endpoints

- POST /api/jobs/run-overdue
  - Authorization: x-job-secret: <JOB_SECRET>
  - Response (direct/fallback): { message, mode: "direct", count, emailed, skipped, errors }
  - Response (queue): { message, mode: "queue", jobId }

- POST /api/jobs/run-expiry
  - Authorization: x-job-secret: <JOB_SECRET>
  - Response (direct/fallback): { message, mode: "direct", count }
  - Response (queue): { message, mode: "queue", jobId }

Notes:
- In development, if JOB_SECRET is unset and NODE_ENV !== production, routes are open.
- In production, JOB_SECRET must be set and provided.

## Workers and Queues

- Files
  - server/jobs/queues.ts: Exports queues when ENABLE_BULL_WORKER !== "false" and Redis configured
  - server/jobs/overdue-reminders-worker.ts: Worker guarded against duplicate start in dev
  - server/jobs/overdue-reminders.ts: Business logic; emails via Resend

- Dev guidance
  - Keep ENABLE_BULL_WORKER=false locally to avoid Upstash free tier command limits.
  - API routes fall back to direct Prisma execution when queue is disabled.

## Scheduling (Production)

Use Upstash QStash Cron to call the HTTP endpoints with secret header.

Examples:
- Overdue reminders (daily at 08:00 UTC):
  - Method: POST
  - URL: https://<your-domain>/api/jobs/run-overdue
  - Header: x-job-secret: <JOB_SECRET>
  - Cron: 0 8 * * *

- Reservation expiry (hourly):
  - Method: POST
  - URL: https://<your-domain>/api/jobs/run-expiry
  - Header: x-job-secret: <JOB_SECRET>
  - Cron: 0 * * * *

## Testing and CI

- Unit tests: Vitest
  - npm test runs tests in tests/**
  - tests/overdue-reminders.test.ts mocks Prisma, Clerk, Resend
  - tests/run-overdue-route.test.ts covers route auth, queue vs direct modes

- GitHub Actions: .github/workflows/ci.yml
  - Steps: npm ci -> typecheck -> lint -> test

## Deployment

- Vercel
  - Set all env vars in Vercel settings
  - Run prisma migrate deploy after deploy
  - Ensure UPSTASH_REDIS_URL configured and ENABLE_BULL_WORKER enabled if using queues
