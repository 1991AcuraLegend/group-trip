# WS 2 — Trips + Dashboard

> **Depends on:** WS 0 (Bootstrap)
> **Can parallelize with:** WS 1, 3–6
> **Merge order:** 3rd (after WS 1)

---

## Overview

Implement the Trip CRUD API, trip cover image upload, and the dashboard page showing a grid of the user's trips. The dashboard is the main landing page after login.

---

## Files to Create

### 1. Trip API Routes

#### `src/app/api/trips/route.ts`

**GET** — List user's trips:
1. `withAuth()` to get session
2. Query trips where user is owner OR is a member via TripMember
3. Include `_count: { members: true }` for member count
4. Order by `updatedAt` desc
5. Return `TripWithMemberCount[]`

**POST** — Create trip:
1. `withAuth()` to get session
2. Validate body with `createTripSchema`
3. Create trip with `ownerId: session.user.id`
4. Also create a `TripMember` record with role `OWNER` for the creator
5. Return the created trip

#### `src/app/api/trips/[tripId]/route.ts`

**GET** — Get trip detail:
1. `withAuth()` to get session
2. Verify user is a member of the trip (via TripMember)
3. Fetch trip with all entries and members included (return `TripWithEntries`)
4. 403 if not a member, 404 if trip doesn't exist

**PATCH** — Update trip:
1. `withAuth()` to get session
2. Verify user is a member of the trip
3. Validate body with `updateTripSchema`
4. Update and return the trip

**DELETE** — Delete trip:
1. `withAuth()` to get session
2. Verify user is the **owner** (not just collaborator) → 403 otherwise
3. Delete trip (cascades to all entries and members)
4. Return 204

---

### 2. Upload API

#### `src/app/api/upload/route.ts`

**POST** — Upload trip cover image:
1. `withAuth()` to get session
2. Parse multipart form data (use `request.formData()`)
3. Validate file size (`MAX_UPLOAD_SIZE`) and type (`ACCEPTED_IMAGE_TYPES`)
4. Generate unique filename: `{cuid()}.{ext}`
5. Write to `public/uploads/{filename}`
6. Return `{ url: '/uploads/{filename}' }`

---

### 3. Trip Query Hooks

#### `src/hooks/useTrips.ts`

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query keys
export const tripKeys = {
  all: ['trips'] as const,
  detail: (id: string) => ['trips', id] as const,
};

// Fetch all trips
export function useTrips() {
  return useQuery({
    queryKey: tripKeys.all,
    queryFn: async () => {
      const res = await fetch('/api/trips');
      if (!res.ok) throw new Error('Failed to fetch trips');
      return res.json();
    },
  });
}

// Fetch single trip with entries
export function useTrip(tripId: string) {
  return useQuery({
    queryKey: tripKeys.detail(tripId),
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}`);
      if (!res.ok) throw new Error('Failed to fetch trip');
      return res.json();
    },
  });
}

// Create trip mutation
export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTripInput) => {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create trip');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tripKeys.all }),
  });
}

// Update trip mutation
export function useUpdateTrip(tripId: string) { /* similar pattern */ }

// Delete trip mutation
export function useDeleteTrip() { /* similar pattern, invalidate tripKeys.all */ }

// Upload cover image
export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      return res.json() as Promise<{ url: string }>;
    },
  });
}
```

---

### 4. Dashboard Page

#### `src/app/dashboard/page.tsx`
```tsx
- Server component wrapper
- Title: "My Trips"
- Renders <TripGrid /> (client component)
- "Create Trip" button in header → opens CreateTripModal
```

#### `src/components/dashboard/TripGrid.tsx`
```tsx
'use client';
- Uses useTrips() hook to fetch trips
- Loading state: grid of skeleton cards
- Empty state: "No trips yet. Create your first trip!"
- Maps trips to <TripCard /> components
- CSS Grid: responsive columns (1 col mobile, 2 tablet, 3 desktop)
  grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6
```

#### `src/components/dashboard/TripCard.tsx`
```tsx
Props: trip (TripWithMemberCount)
- Cover image (or gradient placeholder if no image)
- Trip name (h3)
- Description (truncated to 2 lines)
- Date range (if set): "Mar 15 – Mar 22, 2026"
- Member count badge: "3 members"
- Click → navigate to /trips/{tripId}
- Subtle hover effect: shadow-lg transition
```

#### `src/components/dashboard/CreateTripModal.tsx`
```tsx
- Uses <Modal> wrapper
- React Hook Form with createTripSchema
- Fields: name, description (textarea), startDate, endDate, coverImage (file upload)
- Image upload: shows preview, uses useUploadImage() hook
- Submit: useCreateTrip() mutation
- On success: close modal, trip appears in grid (via query invalidation)
```

---

### 5. UI Components (new ones needed)

#### `src/components/ui/Modal.tsx`
```tsx
Props: isOpen (boolean), onClose, title (string), children
- Portal-rendered overlay
- Backdrop click to close
- Escape key to close
- Focus trap (basic: focus first focusable element)
- Tailwind: fixed inset-0, bg-black/50 backdrop, centered white card
```

#### `src/components/ui/Card.tsx`
```tsx
Props: children, className, onClick
- Rounded card with shadow: rounded-lg shadow-md bg-white overflow-hidden
- Optional onClick for clickable cards (adds cursor-pointer, hover effects)
```

---

### 6. Auth Guard Utility

#### `src/lib/trip-auth.ts`
Helper for checking trip membership in API routes:
```ts
import { prisma } from './prisma';

// Returns the TripMember record if user is a member, null otherwise
export async function getTripMembership(tripId: string, userId: string) {
  return prisma.tripMember.findUnique({
    where: { userId_tripId: { userId, tripId } },
  });
}

// Check if user is trip owner
export async function isTripOwner(tripId: string, userId: string) {
  const member = await getTripMembership(tripId, userId);
  return member?.role === 'OWNER';
}
```

---

## Interface Contracts

### What this workstream exports:

| Export | Path | Used by |
|--------|------|---------|
| Trip API routes | `src/app/api/trips/` | Frontend, WS 3, 6 |
| `useTrips()`, `useTrip()` | `src/hooks/useTrips.ts` | WS 4 (trip detail page) |
| `useCreateTrip()`, `useDeleteTrip()` | `src/hooks/useTrips.ts` | Dashboard |
| `tripKeys` | `src/hooks/useTrips.ts` | WS 3, 6 (for invalidation) |
| `getTripMembership()`, `isTripOwner()` | `src/lib/trip-auth.ts` | WS 3, 6 |
| `<Modal>` | `src/components/ui/Modal.tsx` | WS 4, 6 |
| `<Card>` | `src/components/ui/Card.tsx` | WS 4 |
| Upload API | `src/app/api/upload/route.ts` | Dashboard |

### What this workstream consumes:

| Dependency | From | Notes |
|-----------|------|-------|
| `prisma` | WS 0 | Database queries |
| `createTripSchema`, `updateTripSchema` | WS 0 | Validation |
| `TripWithMemberCount`, `TripWithEntries` | WS 0 | Types |
| `withAuth()` | WS 1 | Auth guard (stub until merge) |
| `<Button>`, `<Input>`, `<LoadingSpinner>` | WS 1 | UI primitives |
| `ACCEPTED_IMAGE_TYPES`, `MAX_UPLOAD_SIZE` | WS 0 | Constants |

---

## Stubbing for Parallel Work

Until WS 1 merges:
- Replace `withAuth()` calls with a stub that returns `{ user: { id: 'mock-user', name: 'Test User', email: 'test@test.com' } }`
- Skip middleware redirect checks

If WS 1's UI primitives aren't merged yet:
- Create minimal `<Button>` and `<Input>` components inline or as local stubs

---

## Verification Checklist

- [ ] `GET /api/trips` returns only trips where user is owner or member
- [ ] `POST /api/trips` creates trip + TripMember (OWNER role)
- [ ] `GET /api/trips/[id]` returns trip with all entries and members
- [ ] `PATCH /api/trips/[id]` updates trip fields
- [ ] `DELETE /api/trips/[id]` only works for trip owner, returns 403 for collaborators
- [ ] `POST /api/upload` saves file, returns URL, rejects oversized/wrong-type files
- [ ] Dashboard shows grid of trips with correct data
- [ ] Create trip modal creates trip and it appears in grid
- [ ] Clicking trip card navigates to `/trips/[id]`
- [ ] Empty state shown when user has no trips
- [ ] Loading state shown while fetching trips
- [ ] Cover image upload shows preview before submission
