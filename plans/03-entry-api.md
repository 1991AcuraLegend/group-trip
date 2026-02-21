# WS 3 — Entry APIs

> **Depends on:** WS 0 (Bootstrap)
> **Can parallelize with:** WS 1, 2, 4–6
> **Merge order:** 4th (after WS 2)

---

## Overview

Implement CRUD API routes for all five entry types: flights, lodging, car rentals, restaurants, and activities. Uses a single unified endpoint with a discriminated union for the entry type. This workstream is API-only — no UI components.

---

## Files to Create

### 1. Entry API Routes

#### `src/app/api/trips/[tripId]/entries/route.ts`

**GET** — List all entries for a trip:
1. `withAuth()` to get session
2. Verify user is a trip member (using `getTripMembership`)
3. Fetch all 5 entry types in parallel:
   ```ts
   const [flights, lodgings, carRentals, restaurants, activities] = await Promise.all([
     prisma.flight.findMany({ where: { tripId }, orderBy: { departureDate: 'asc' } }),
     prisma.lodging.findMany({ where: { tripId }, orderBy: { checkIn: 'asc' } }),
     prisma.carRental.findMany({ where: { tripId }, orderBy: { pickupDate: 'asc' } }),
     prisma.restaurant.findMany({ where: { tripId }, orderBy: { date: 'asc' } }),
     prisma.activity.findMany({ where: { tripId }, orderBy: { date: 'asc' } }),
   ]);
   ```
4. Return `{ flights, lodgings, carRentals, restaurants, activities }`

**POST** — Create entry:
1. `withAuth()` to get session
2. Verify user is a trip member
3. Parse body with `createEntrySchema` (discriminated union on `type` field)
4. Based on `type`, insert into the correct table with `createdById: session.user.id`
5. Return the created entry with `{ type, data }` wrapper

Implementation pattern for POST:
```ts
const body = createEntrySchema.parse(await request.json());

switch (body.type) {
  case 'flight': {
    const { type, ...data } = body;
    const flight = await prisma.flight.create({
      data: { ...data, tripId, createdById: session.user.id },
    });
    return NextResponse.json({ type: 'flight', data: flight }, { status: 201 });
  }
  case 'lodging': { /* similar */ }
  case 'carRental': { /* similar */ }
  case 'restaurant': { /* similar */ }
  case 'activity': { /* similar */ }
}
```

---

#### `src/app/api/trips/[tripId]/entries/[entryId]/route.ts`

This route needs to figure out which table the entry belongs to. Strategy: try each table in sequence, or accept `type` as a query parameter.

**Recommended approach:** Accept `?type=flight|lodging|carRental|restaurant|activity` as a query parameter. The frontend always knows the entry type.

**GET** — Get single entry:
1. `withAuth()` + verify trip membership
2. Read `type` from query params
3. Fetch from the correct table by `id` and `tripId`
4. 404 if not found
5. Return `{ type, data }`

**PATCH** — Update entry:
1. `withAuth()` + verify trip membership
2. Read `type` from query params
3. Validate body (use the appropriate partial schema for the type)
4. Update in the correct table
5. Return updated `{ type, data }`

**DELETE** — Delete entry:
1. `withAuth()` + verify trip membership
2. Read `type` from query params
3. Delete from the correct table
4. 204 No Content

---

### 2. Entry Query Hooks

#### `src/hooks/useEntries.ts`

```ts
// Query keys
export const entryKeys = {
  all: (tripId: string) => ['trips', tripId, 'entries'] as const,
  detail: (tripId: string, entryId: string) => ['trips', tripId, 'entries', entryId] as const,
};

// Fetch all entries for a trip
export function useEntries(tripId: string) {
  return useQuery({
    queryKey: entryKeys.all(tripId),
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/entries`);
      if (!res.ok) throw new Error('Failed to fetch entries');
      return res.json() as Promise<{
        flights: Flight[];
        lodgings: Lodging[];
        carRentals: CarRental[];
        restaurants: Restaurant[];
        activities: Activity[];
      }>;
    },
    enabled: !!tripId,
  });
}

// Create entry mutation
export function useCreateEntry(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateEntryInput) => {
      const res = await fetch(`/api/trips/${tripId}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create entry');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entryKeys.all(tripId) });
    },
  });
}

// Update entry mutation
export function useUpdateEntry(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ entryId, type, data }: { entryId: string; type: EntryType; data: any }) => {
      const res = await fetch(`/api/trips/${tripId}/entries/${entryId}?type=${type}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update entry');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entryKeys.all(tripId) });
    },
  });
}

// Delete entry mutation
export function useDeleteEntry(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ entryId, type }: { entryId: string; type: EntryType }) => {
      const res = await fetch(`/api/trips/${tripId}/entries/${entryId}?type=${type}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete entry');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entryKeys.all(tripId) });
    },
  });
}
```

---

### 3. Entry Utility Helpers

#### `src/lib/entry-helpers.ts`

```ts
import type { Flight, Lodging, CarRental, Restaurant, Activity } from '@prisma/client';
import type { MappableEntry, EntryType } from '@/types';

// Convert entries to mappable pins (only entries with lat/lng)
export function entriesToMappable(entries: {
  lodgings: Lodging[];
  carRentals: CarRental[];
  restaurants: Restaurant[];
  activities: Activity[];
}): MappableEntry[] {
  const pins: MappableEntry[] = [];

  entries.lodgings.forEach(l => {
    if (l.lat && l.lng) pins.push({ id: l.id, type: 'lodging', name: l.name, lat: l.lat, lng: l.lng, address: l.address });
  });
  entries.carRentals.forEach(c => {
    if (c.pickupLat && c.pickupLng) pins.push({ id: c.id, type: 'carRental', name: c.company, lat: c.pickupLat, lng: c.pickupLng, address: c.pickupAddress });
  });
  entries.restaurants.forEach(r => {
    if (r.lat && r.lng) pins.push({ id: r.id, type: 'restaurant', name: r.name, lat: r.lat, lng: r.lng, address: r.address });
  });
  entries.activities.forEach(a => {
    if (a.lat && a.lng) pins.push({ id: a.id, type: 'activity', name: a.name, lat: a.lat!, lng: a.lng!, address: a.address || '' });
  });

  return pins;
}

// Get the date to sort/display for any entry
export function getEntryDate(type: EntryType, entry: any): Date {
  switch (type) {
    case 'flight': return new Date(entry.departureDate);
    case 'lodging': return new Date(entry.checkIn);
    case 'carRental': return new Date(entry.pickupDate);
    case 'restaurant': return new Date(entry.date);
    case 'activity': return new Date(entry.date);
  }
}

// Get display name for an entry
export function getEntryName(type: EntryType, entry: any): string {
  switch (type) {
    case 'flight': return `${entry.airline} ${entry.flightNumber || ''}`.trim();
    case 'lodging': return entry.name;
    case 'carRental': return entry.company;
    case 'restaurant': return entry.name;
    case 'activity': return entry.name;
  }
}
```

---

## Interface Contracts

### What this workstream exports:

| Export | Path | Used by |
|--------|------|---------|
| Entry API routes | `src/app/api/trips/[tripId]/entries/` | WS 4 (forms), WS 5 (map data) |
| `useEntries()` | `src/hooks/useEntries.ts` | WS 4 (entry panel), WS 5 (map) |
| `useCreateEntry()` | `src/hooks/useEntries.ts` | WS 4 (entry forms) |
| `useUpdateEntry()` | `src/hooks/useEntries.ts` | WS 4 (entry forms) |
| `useDeleteEntry()` | `src/hooks/useEntries.ts` | WS 4 (entry cards) |
| `entryKeys` | `src/hooks/useEntries.ts` | WS 5, 6 |
| `entriesToMappable()` | `src/lib/entry-helpers.ts` | WS 5 (map pins) |
| `getEntryDate()`, `getEntryName()` | `src/lib/entry-helpers.ts` | WS 4 (display) |

### What this workstream consumes:

| Dependency | From | Notes |
|-----------|------|-------|
| `prisma` | WS 0 | Database queries |
| `createEntrySchema` (discriminated union) | WS 0 | Request validation |
| Entry types (`Flight`, `Lodging`, etc.) | WS 0 | TypeScript types |
| `withAuth()` | WS 1 | Auth guard (stub until merge) |
| `getTripMembership()` | WS 2 | Trip access check (stub until merge) |

---

## Stubbing for Parallel Work

Until WS 2 merges:
- Stub `getTripMembership()`: always return `{ role: 'OWNER' }` for any userId/tripId
- Skip trip existence checks

Until WS 1 merges:
- Stub `withAuth()`: return mock session

For WS 4 (entry panel) working before this merges:
- WS 4 can define the hooks with mock data
- Entry forms can use the validators locally
- Replace mock hooks with real ones from `useEntries.ts` after merge

---

## Verification Checklist

- [ ] `GET /api/trips/[id]/entries` returns all 5 entry types
- [ ] `POST /api/trips/[id]/entries` with `type: 'flight'` creates a flight
- [ ] `POST /api/trips/[id]/entries` with `type: 'lodging'` creates a lodging (repeat for all types)
- [ ] Validation errors return 400 with Zod error messages
- [ ] `PATCH /api/trips/[id]/entries/[entryId]?type=flight` updates a flight
- [ ] `DELETE /api/trips/[id]/entries/[entryId]?type=flight` removes a flight
- [ ] Non-members get 403 on all routes
- [ ] `createdById` is set correctly from session
- [ ] `entriesToMappable()` correctly filters out entries without lat/lng
- [ ] `getEntryDate()` returns correct date for each type
- [ ] All entry types can be created, read, updated, and deleted
