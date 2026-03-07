# TravelPlanner

TravelPlanner is a collaborative trip-planning app built with Next.js, Prisma, NextAuth, and PostgreSQL. It supports shared trips, role-based access, interactive maps, timeline views, and idea-to-plan workflows.

## Current Status

- Production build, lint, and unit tests pass.
- Core trip planning and sharing flows are implemented.
- Password reset is implemented with time-limited tokens and Resend-backed email delivery in production.
- Log maintenance should be triggered by an external scheduler calling the maintenance API, not by in-process timers inside the web app.

## Features

- Shared trip management with owner, collaborator, and viewer roles
- Entry support for flights, lodging, car rentals, restaurants, and activities
- Separate idea and confirmed-plan workflows
- Timeline and map views for trip visualization
- Share-code based joining with owner-controlled permissions
- User settings for name and password changes

## Local Development

### Prerequisites

- Node.js 20+
- PostgreSQL 16+

### Setup

1. Install dependencies.

```bash
npm install
```

2. Copy the example env file and set real values.

```bash
cp .env.example .env.local
```

Required values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/travelplanner"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
RESEND_API_KEY="your-resend-api-key"
RESEND_FROM_EMAIL="TravelPlanner <noreply@mail.cbesmer.com>"
```

Resend setup for live password reset emails:

1. Create an API key in Resend.
2. Set `RESEND_API_KEY` in your local env or deploy env.
3. Set `RESEND_FROM_EMAIL` to a sender address backed by a verified Resend domain.
4. Example verified sender: `TravelPlanner <noreply@mail.cbesmer.com>`.

3. Apply migrations.

```bash
npx prisma migrate dev
```

4. Start the app.

```bash
npm run dev
```

### Useful Commands

```bash
npm run build
npm run lint
npm run test
npm run test:e2e
npx prisma studio
```

### Seed Data

```bash
./seed-db.sh --force
```

Production seeding requires an explicit second flag:

```bash
NODE_ENV=production ./seed-db.sh --force --allow-production
```

## Docker

### Local Docker Compose

Use [docker-compose.yml](/Users/corey/Projects/TravelPlanner/docker-compose.yml) for local containerized development.

```bash
cp .env.docker.example .env.docker
docker compose --env-file .env.docker up --build
```

### Deployment Compose

Use [docker-compose.deploy.yml](/Users/corey/Projects/TravelPlanner/docker-compose.deploy.yml) for image-based deployment.

- It expects a prebuilt image in GHCR.
- `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are required.
- `RESEND_API_KEY` is required if you want password reset emails to work in production.
- `RESEND_FROM_EMAIL` should be a verified sender address for live delivery.
- The database is only exposed on the internal compose network.
- `LOG_MAINTENANCE_SECRET` can be set to protect the maintenance endpoint.

Run:

```bash
docker compose -f docker-compose.deploy.yml --env-file .env.docker up -d
```

Typical production values in `.env.docker`:

```env
NEXTAUTH_URL=https://grouptravel.cbesmer.com
NEXTAUTH_SECRET=generate-a-long-random-secret
RESEND_API_KEY=re_your_real_key
RESEND_FROM_EMAIL="TravelPlanner <noreply@mail.cbesmer.com>"
```

## Logging

Application logs are written to `.logs/` and can be inspected via the endpoints documented in [LOGGING.md](/Users/corey/Projects/TravelPlanner/LOGGING.md).

For production log maintenance, schedule a daily authenticated `POST` to `/api/logs/maintain` from your platform cron, CI, or host scheduler.

## Tech Stack

- Next.js 14 App Router
- TypeScript
- PostgreSQL + Prisma
- NextAuth credentials auth
- React Query
- React Hook Form + Zod
- Tailwind CSS
- Leaflet + OpenStreetMap
- Vitest + Playwright

## Project Notes

- Architecture and codebase conventions: [CLAUDE.md](/Users/corey/Projects/TravelPlanner/CLAUDE.md)
- Product roadmap: [MASTER_PLAN.md](/Users/corey/Projects/TravelPlanner/MASTER_PLAN.md)
- Feature plans: [plans](/Users/corey/Projects/TravelPlanner/plans)
