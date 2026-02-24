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

**Auth:** NextAuth with CredentialsProvider + JWT strategy. `bcryptjs` (12 salt rounds) for passwords. Session augmented with `user.id` via `src/types/next-auth.d.ts`. Middleware protects `/dashboard`, `/trips`, and `/settings` routes; auth pages and `/join/[code]` are public.

**Provider hierarchy** (root layout): `AuthProvider` (next-auth SessionProvider) → `QueryProvider` (TanStack React Query, staleTime 60s) → `ThemeProvider` (coastal/y2k themes, user-specific localStorage keyed by `theme:<userId>`).

**Data flow:** `prisma/schema.prisma` → `@prisma/client` types → `src/types/index.ts` (re-exports + composite types like `TripWithEntries`, `TripWithMemberCount`, `MappableEntry`) → validators + hooks + components. All IDs are cuid strings. Deleting a Trip cascades to all entries and memberships.

**Roles:** `MemberRole` enum: `OWNER | COLLABORATOR | VIEWER`. Owner has full control and cannot leave. Collaborators can CRUD entries. Viewers are read-only (403 on write operations).

## Key Patterns

**API routes** use `withAuth()` from `src/lib/auth-helpers.ts` — a HOF that checks the session and returns 401 or calls the handler with a typed session. Trip-level auth uses `getTripMembership()` / `isTripOwner()` from `src/lib/trip-auth.ts`. Viewer role is checked before write operations.

**React Query hooks** (in `src/hooks/`) export typed query keys, `useQuery` hooks for reads, and `useMutation` hooks with `onSuccess` cache invalidation. Entry mutations pass `?type=flight|lodging|...` as a query param to the shared `[entryId]` route. Separate hooks exist for ideas vs plan entries (`useEntries`/`useIdeas`, `useCreateEntry`/`useCreateIdea`).

**Forms** use React Hook Form + `zodResolver` with schemas from `src/validators/`. Date inputs use `datetime-local` or `date` HTML types; `src/components/trip/forms/shared.ts` provides `toDatetimeLocal()`, `toDateInput()`, `toISO()` for conversion. API routes convert strings to `Date` before Prisma writes. Validators use `z.string()` (not `z.date()` or `z.string().datetime()`) for date fields to support HTML input values.

**Entry system:** Five entry types (flight, lodging, carRental, restaurant, activity) stored as separate Prisma models with a discriminated union schema (`createEntrySchema`). The POST route `switch`es on `type` to create in the right Prisma model. Update schemas are derived inline: `createFlightSchema.omit({ type: true }).partial()`.

**Ideas vs Plans:** All entry models have an `isIdea` boolean. When `isIdea: true`, dates are nullable (brainstorming). When `false`, dates are required (confirmed plans). Separate Zod schemas (`createEntrySchema` vs `createIdeaEntrySchema`) and separate form components (`forms/` vs `forms/idea/`). "Move to Plan" flow: user fills in required dates via `MoveToPlanModal` → PATCH with `isIdea: false`.

**Map:** Leaflet via react-leaflet, dynamically imported (`next/dynamic` with `ssr: false`) in `TripMap.tsx`. Geocoding uses Nominatim (User-Agent: "TravelPlanner/1.0") with 500ms debounce via `useGeocoding` hook. Custom SVG markers colored by entry type. Flights excluded from map (no lat/lng). `entriesToMappable()` in `src/lib/entry-helpers.ts` filters entries with coordinates.

**Timeline:** `src/lib/timeline-utils.ts` implements a sweep-line algorithm for overlapping entry layout. 24px per hour, per-day column assignment, flexible time parsing ("7:30 PM", "19:30", "7pm"). All-day items at top, timed items below. Point events default to 1-hour display. Uses UTC methods throughout to prevent timezone shifts.

**Sharing:** Two share codes per trip. Owner's configurable link (`shareCode` + `shareRole` field, COLLABORATOR or VIEWER) is regenerable. A separate view-only link (`viewerShareCode`, always VIEWER) is auto-generated and visible to non-owner members. `/join/[code]` page is public (shows trip info), POST requires auth. `TripMember` has `@@unique([userId, tripId])`.

**Theming:** Two themes — "coastal" (default, warm beach tones) and "y2k" (aero glass with cyan/pink/mint). CSS custom properties on `[data-theme]` attribute. An inline script in root layout decodes the JWT cookie client-side to read user-specific localStorage and set `data-theme` before first paint (prevents flash). `useTheme()` hook from `src/providers/ThemeProvider.tsx`. Y2K theme activates glass effects (`--glass-bg`, `--glass-blur`), button glows, and gradient backgrounds.

**File uploads:** POST `/api/upload` accepts JPEG/PNG/WebP up to 5MB, saves to `public/uploads/` with nanoid filenames. Used for trip cover images. Constants in `src/lib/constants.ts`.

**Mobile layout:** `useIsMobile` hook (< 1024px). Trip detail page uses split view on desktop (540px EntryPanel + flexible map) and bottom tab bar toggle on mobile. Ideas page uses 5-column grid on desktop, tabbed single column on mobile.
