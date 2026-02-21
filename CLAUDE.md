# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Next.js dev server (port 3000)
npm run build        # Production build
npm run lint         # ESLint via Next.js
npm run test         # Vitest (jsdom, globals: true)
npm run test:e2e     # Playwright (Chromium, needs dev server)
npx prisma migrate dev   # Run Prisma migrations
npx prisma studio        # Open Prisma GUI
```

`postinstall` runs `prisma generate` automatically. Path alias: `@/*` → `./src/*`.

## Architecture

Next.js 14 App Router, TypeScript strict, PostgreSQL via Prisma, Tailwind CSS.

**Auth:** NextAuth with CredentialsProvider + JWT strategy. `bcryptjs` for passwords. Session augmented with `user.id` via `src/types/next-auth.d.ts`. Middleware protects `/dashboard` and `/trips` routes; auth pages and `/join/[code]` are public.

**Provider hierarchy** (root layout): `AuthProvider` (next-auth SessionProvider) → `QueryProvider` (TanStack React Query, staleTime 60s).

**Data flow:** `prisma/schema.prisma` → `@prisma/client` types → `src/types/index.ts` (re-exports + composite types like `TripWithEntries`, `TripWithMemberCount`) → validators + hooks + components. All IDs are cuid strings. Deleting a Trip cascades to all entries and memberships.

## Key Patterns

**API routes** use `withAuth()` from `src/lib/auth-helpers.ts` — a HOF that checks the session and returns 401 or calls the handler with a typed session. Trip-level auth uses `getTripMembership()` / `isTripOwner()` from `src/lib/trip-auth.ts`.

**React Query hooks** (in `src/hooks/`) export typed query keys, `useQuery` hooks for reads, and `useMutation` hooks with `onSuccess` cache invalidation. Entry mutations pass `?type=flight|lodging|...` as a query param to the shared `[entryId]` route.

**Forms** use React Hook Form + `zodResolver` with schemas from `src/validators/`. Date inputs use `datetime-local` or `date` HTML types; `src/components/trip/forms/shared.ts` provides `toDatetimeLocal()`, `toDateInput()`, `toISO()` for conversion. API routes convert strings to `Date` before Prisma writes. Validators use `z.string()` (not `z.date()` or `z.string().datetime()`) for date fields to support HTML input values.

**Entry system:** Five entry types (flight, lodging, carRental, restaurant, activity) share a discriminated union schema (`createEntrySchema`). The POST route `switch`es on `type` to create in the right Prisma model. Update schemas are derived inline: `createFlightSchema.omit({ type: true }).partial()`.

**Map:** Leaflet via react-leaflet, dynamically imported (`next/dynamic` with `ssr: false`) in `TripMap.tsx`. Geocoding uses Nominatim with 500ms debounce. Custom SVG markers colored by entry type.

**Sharing:** Owner generates a share code → `/join/[code]` page lets authenticated users join as COLLABORATOR. `TripMember` has `@@unique([userId, tripId])` and role enum `OWNER | COLLABORATOR`.
