# TravelPlanner - Agent Memory

## Project Overview
- Next.js 14 App Router, TypeScript strict, PostgreSQL via Prisma, Tailwind CSS
- Path alias: `@/*` -> `./src/*`

## Design System (Coastal Beach Theme - Feb 2026)
- Custom color palette: `ocean`, `sand`, `coral`, `seafoam` defined in `tailwind.config.ts`
- Fonts: DM Sans (body/sans), DM Serif Display (headings/display) via `next/font/google`
- Font variables: `--font-sans`, `--font-display`; Tailwind classes: `font-sans`, `font-display`
- Body defaults: `bg-sand-50 text-sand-800 font-sans`
- Primary actions: `ocean-600/700`, Secondary: `sand-100/200`, Danger: `coral-600/700`
- Success/positive: `seafoam-50/800`
- Landing page at `/` for unauthenticated users, redirects to `/dashboard` if authenticated

## Key Patterns
- `withAuth()` HOF for API route auth
- React Query hooks in `src/hooks/`
- Entry types: flight, lodging, carRental, restaurant, activity
- Entry colors in `src/lib/constants.ts` use ocean/seafoam/sand/coral palette
- UI primitives in `src/components/ui/` (Button, Input, Card, Tabs, Modal, LoadingSpinner)

## Pre-existing Issues
- ESLint config only extends `next/core-web-vitals` - no `@typescript-eslint` plugin configured
- Avoid `@typescript-eslint/*` eslint-disable comments as they cause build failures
