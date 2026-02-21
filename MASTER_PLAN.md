# TravelPlanner — Master Plan

A collaborative travel planning website where users create trips, add entries (flights, lodging, car rentals, restaurants, activities), view them on a map, and share trips with others.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js (Credentials provider) |
| Maps | Leaflet + OpenStreetMap (free, no API key) |
| Geocoding | Nominatim (OpenStreetMap-based, free, no API key) |
| Styling | Tailwind CSS |
| Server State | TanStack Query v5 |
| Forms | React Hook Form + Zod validation |
| Testing | Vitest (unit), Playwright (e2e) |
| IDs | nanoid for share codes |

---

## Project Structure

```
TravelPlanner/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout (providers)
│   │   ├── page.tsx                    # Landing → redirect to /dashboard
│   │   ├── globals.css
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── trips/
│   │   │   │   ├── route.ts            # GET (list), POST (create)
│   │   │   │   └── [tripId]/
│   │   │   │       ├── route.ts        # GET, PATCH, DELETE
│   │   │   │       ├── entries/
│   │   │   │       │   ├── route.ts    # GET (all entries), POST
│   │   │   │       │   └── [entryId]/
│   │   │   │       │       └── route.ts # GET, PATCH, DELETE
│   │   │   │       ├── share/
│   │   │   │       │   └── route.ts    # POST (generate link), GET (info)
│   │   │   │       └── members/
│   │   │   │           ├── route.ts    # GET (list), DELETE (remove)
│   │   │   │           └── [memberId]/
│   │   │   │               └── route.ts
│   │   │   ├── join/[code]/
│   │   │   │   └── route.ts           # POST (join via share code)
│   │   │   └── upload/
│   │   │       └── route.ts           # POST (image upload)
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── trips/[tripId]/
│   │   │   └── page.tsx               # Trip detail (map + entries)
│   │   └── join/[code]/
│   │       └── page.tsx               # Join trip UI
│   ├── components/
│   │   ├── ui/                        # Shared UI primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Tabs.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ForgotPasswordForm.tsx
│   │   ├── dashboard/
│   │   │   ├── TripGrid.tsx
│   │   │   ├── TripCard.tsx
│   │   │   └── CreateTripModal.tsx
│   │   ├── trip/
│   │   │   ├── TripHeader.tsx
│   │   │   ├── EntryPanel.tsx
│   │   │   ├── EntryList.tsx
│   │   │   ├── EntryCard.tsx
│   │   │   └── forms/
│   │   │       ├── FlightForm.tsx
│   │   │       ├── LodgingForm.tsx
│   │   │       ├── CarRentalForm.tsx
│   │   │       ├── RestaurantForm.tsx
│   │   │       └── ActivityForm.tsx
│   │   ├── map/
│   │   │   ├── TripMap.tsx
│   │   │   ├── MapPin.tsx
│   │   │   └── AddressAutocomplete.tsx
│   │   └── sharing/
│   │       ├── ShareModal.tsx
│   │       ├── MemberList.tsx
│   │       └── JoinTripPage.tsx
│   ├── lib/
│   │   ├── prisma.ts                  # Prisma client singleton
│   │   ├── auth.ts                    # NextAuth config
│   │   ├── auth-helpers.ts            # getServerSession helpers
│   │   ├── geocoding.ts              # Nominatim API wrapper
│   │   ├── share-codes.ts            # nanoid share code generation
│   │   ├── upload.ts                 # Image upload utilities
│   │   └── constants.ts              # App-wide constants
│   ├── types/
│   │   └── index.ts                  # Shared TypeScript types
│   ├── validators/
│   │   ├── trip.ts                   # Trip Zod schemas
│   │   ├── entry.ts                  # Entry Zod schemas (all 5 types)
│   │   ├── auth.ts                   # Auth Zod schemas
│   │   └── sharing.ts               # Sharing Zod schemas
│   ├── hooks/
│   │   ├── useTrips.ts              # TanStack Query hooks for trips
│   │   ├── useEntries.ts            # TanStack Query hooks for entries
│   │   ├── useMembers.ts            # TanStack Query hooks for members
│   │   └── useGeocoding.ts          # Geocoding hook with debounce
│   └── providers/
│       ├── QueryProvider.tsx         # TanStack Query provider
│       └── AuthProvider.tsx          # NextAuth SessionProvider
├── public/
│   ├── uploads/                     # Trip cover images (MVP: local storage)
│   └── marker-icons/               # Custom map pin SVGs
├── tests/
│   ├── unit/
│   └── e2e/
├── .env.example
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── vitest.config.ts
├── playwright.config.ts
└── MASTER_PLAN.md
```

---

## Database Schema

```
┌──────────────┐       ┌──────────────────┐
│    User       │       │    Trip           │
├──────────────┤       ├──────────────────┤
│ id       PK  │──┐    │ id           PK  │
│ email        │  │    │ name             │
│ name         │  │    │ description      │
│ passwordHash │  │    │ coverImage       │
│ createdAt    │  │    │ startDate        │
│ updatedAt    │  └───→│ ownerId      FK  │
└──────────────┘       │ shareCode        │
       │               │ createdAt        │
       │               │ updatedAt        │
       │               └──────────────────┘
       │                        │
       │    ┌───────────────────┘
       ▼    ▼
┌──────────────────┐
│  TripMember       │
├──────────────────┤
│ id           PK  │
│ userId       FK  │
│ tripId       FK  │
│ role (OWNER/     │
│   COLLABORATOR)  │
│ joinedAt         │
└──────────────────┘

Entry tables (all have tripId FK):
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Flight     │ │   Lodging    │ │  CarRental   │ │  Restaurant  │ │   Activity   │
├──────────────┤ ├──────────────┤ ├──────────────┤ ├──────────────┤ ├──────────────┤
│ id       PK  │ │ id       PK  │ │ id       PK  │ │ id       PK  │ │ id       PK  │
│ tripId   FK  │ │ tripId   FK  │ │ tripId   FK  │ │ tripId   FK  │ │ tripId   FK  │
│ airline      │ │ name         │ │ company      │ │ name         │ │ name         │
│ flightNumber │ │ address      │ │ pickupAddr   │ │ address      │ │ address      │
│ departure    │ │ checkIn      │ │ dropoffAddr  │ │ date         │ │ date         │
│ arrival      │ │ checkOut     │ │ pickupDate   │ │ time         │ │ startTime    │
│ departCity   │ │ lat          │ │ dropoffDate  │ │ lat          │ │ endTime      │
│ arriveCity   │ │ lng          │ │ pickupLat    │ │ lng          │ │ lat          │
│ departAirport│ │ confirmNum   │ │ pickupLng    │ │ cuisine      │ │ lng          │
│ arriveAirport│ │ notes        │ │ confirmNum   │ │ priceRange   │ │ category     │
│ confirmNum   │ │ cost         │ │ notes        │ │ reservationId│ │ cost         │
│ notes        │ │ createdById  │ │ cost         │ │ notes        │ │ notes        │
│ cost         │ │ createdAt    │ │ createdById  │ │ cost         │ │ bookingRef   │
│ createdById  │ │ updatedAt    │ │ createdAt    │ │ createdById  │ │ createdById  │
│ createdAt    │ └──────────────┘ │ updatedAt    │ │ createdAt    │ │ createdAt    │
│ updatedAt    │                  └──────────────┘ │ updatedAt    │ │ updatedAt    │
└──────────────┘                                   └──────────────┘ └──────────────┘
```

---

## API Routes

### Auth
- `POST /api/auth/[...nextauth]` — NextAuth handlers (login, register, session)

### Trips
- `GET    /api/trips` — List user's trips (owned + collaborating)
- `POST   /api/trips` — Create trip
- `GET    /api/trips/[tripId]` — Get trip details
- `PATCH  /api/trips/[tripId]` — Update trip
- `DELETE /api/trips/[tripId]` — Delete trip (owner only)

### Entries (generic, type-discriminated)
- `GET    /api/trips/[tripId]/entries` — List all entries (all types)
- `POST   /api/trips/[tripId]/entries` — Create entry (type in body)
- `GET    /api/trips/[tripId]/entries/[entryId]` — Get single entry
- `PATCH  /api/trips/[tripId]/entries/[entryId]` — Update entry
- `DELETE /api/trips/[tripId]/entries/[entryId]` — Delete entry

### Sharing
- `POST   /api/trips/[tripId]/share` — Generate/regenerate share link
- `GET    /api/trips/[tripId]/share` — Get share info
- `GET    /api/trips/[tripId]/members` — List members
- `DELETE /api/trips/[tripId]/members/[memberId]` — Remove member (owner only)
- `POST   /api/join/[code]` — Join trip via share code

### Upload
- `POST   /api/upload` — Upload trip cover image

---

## Frontend Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Redirect to `/dashboard` if authenticated, else to `/login` |
| `/login` | Login | Email/password login form |
| `/register` | Register | Registration form |
| `/forgot-password` | Forgot Password | Console-log-only reset (MVP) |
| `/dashboard` | Dashboard | Grid of trip cards, create button |
| `/trips/[tripId]` | Trip Detail | Split view: map (left) + entry panel (right) |
| `/join/[code]` | Join Trip | Accept invitation UI |

---

## Integration Points & Shared Contracts

### Shared Types (`src/types/index.ts`)
All workstreams import from this single source of truth. Defined in WS 0.

### Shared Validators (`src/validators/`)
Zod schemas used by both API routes and forms. Defined in WS 0.

### Prisma Client (`src/lib/prisma.ts`)
Singleton instance. Defined in WS 0, consumed by all API routes.

### Auth Helpers (`src/lib/auth-helpers.ts`)
`getServerSession()` wrapper. Defined in WS 1, consumed by all protected API routes. Other workstreams stub this until WS 1 merges.

### TanStack Query Hooks (`src/hooks/`)
- `useTrips` — WS 2 defines, WS 4 consumes
- `useEntries` — WS 3 defines, WS 4/5 consume
- `useMembers` — WS 6 defines

### Geocoding (`src/lib/geocoding.ts` + `src/hooks/useGeocoding.ts`)
Defined in WS 5, consumed by entry forms in WS 4. WS 4 stubs the autocomplete until WS 5 merges.

### Pin Colors (constants)
Defined in `src/lib/constants.ts` (WS 0):
- Lodging = `#3B82F6` (blue)
- CarRental = `#F97316` (orange)
- Restaurant = `#EF4444` (red)
- Activity = `#22C55E` (green)
- Flight = no pin (no fixed location)

---

## Testing Strategy

### Unit Tests (Vitest)
- Validators (Zod schemas)
- Utility functions (geocoding, share codes, auth helpers)
- React components (with React Testing Library)

### E2E Tests (Playwright)
- Auth flow (register → login → logout)
- Trip CRUD (create → view → edit → delete)
- Entry CRUD (add flight → add lodging → view on map)
- Sharing flow (generate link → join → verify access)

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Leaflet + OSM | Free, no API key, good enough for MVP |
| Nominatim geocoding | Free, OSM-based, no signup required |
| Credentials provider | Simple email/password for MVP; OAuth can be added later |
| Console-log password reset | No email service dependency for MVP |
| TanStack Query | Handles caching, deduplication, optimistic updates |
| Page-refresh sync | No WebSocket complexity; TanStack Query refetches on focus |
| Separate entry tables | Each entry type has different fields; union type in TypeScript |
| Local file upload | `public/uploads/` for MVP; S3 can be added later |
| nanoid share codes | Short, URL-safe, collision-resistant |
| Role-based permissions | Owner vs Collaborator; collaborators can't delete trips |
