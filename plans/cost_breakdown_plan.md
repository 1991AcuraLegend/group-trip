# Cost Breakdown Page: Implementation Plan

## Context

This feature adds a **Cost Breakdown** page to each trip, accessible via a button on the trip header. The page displays a grid where rows are plan entries (with costs), columns are trip members, and each cell shows that member's share of the entry based on the attendees system (from `attendees_plan.md`). This feature **depends on the attendees feature being implemented first** — specifically the `attendeeIds: String[]` field on all entry models.

---

## 1. New Route — `/trips/[tripId]/costs`

**New file:** `src/app/trips/[tripId]/costs/page.tsx`

Follow the existing pattern used by `timeline/page.tsx` and `ideas/page.tsx`:

```tsx
import { CostBreakdown } from '@/components/trip/CostBreakdown';

export default function CostsPage({ params }: { params: { tripId: string } }) {
  return <CostBreakdown tripId={params.tripId} />;
}
```

This is a thin server-component wrapper delegating to a `'use client'` component.

---

## 2. Navigation — Add "Cost Breakdown" Button to Trip Header

**File:** `src/components/trip/TripHeader.tsx`

Add a "Cost Breakdown" button to the action buttons area (alongside Edit Trip, Share, Delete). This button should be visible to **all trip members** (not just owners) since viewing cost data is a read-only operation.

**Placement:** Inside the `<div className="flex items-center gap-2 shrink-0 sm:order-last">` block, insert before the Share button:

```tsx
<Link href={`/trips/${trip.id}/costs`}>
  <Button variant="secondary" size="sm">
    Cost Breakdown
  </Button>
</Link>
```

Add `Link` from `next/link` to the existing imports.

---

## 3. Cost Breakdown Utility Functions

**New file:** `src/lib/cost-breakdown-utils.ts`

This module contains the pure logic for computing the cost grid. Keeping it separate from the component enables unit testing.

### Types

```ts
import type { Flight, Lodging, CarRental, Restaurant, Activity } from '@prisma/client';
import type { EntryType } from '@/types';

export type CostRow = {
  id: string;
  type: EntryType;
  name: string;                    // display name (airline+number, hotel name, etc.)
  totalCost: number;               // entry's total cost
  date: Date | null;               // primary date for sorting
  attendeeIds: string[];           // user IDs of attendees
  entry: Flight | Lodging | CarRental | Restaurant | Activity;  // raw entry for popover
};

export type CostGrid = {
  rows: CostRow[];                 // entries with cost > 0, sorted by date
  memberIds: string[];             // ordered list of member user IDs (columns)
  memberNames: Record<string, string>;  // userId → display name
  totals: Record<string, number>;  // userId → total share across all entries
};
```

### `buildCostGrid(entries, members)` function

**Parameters:**
- `entries`: `EntriesData` (from `useEntries` hook — `{ flights, lodgings, carRentals, restaurants, activities }`)
- `members`: `MemberWithUser[]` (from `useMembers` hook)

**Logic:**

1. **Flatten all entries** into a unified `CostRow[]` array. Iterate over each entry type using the existing `getEntryName()` and `getEntryDate()` helpers from `src/lib/entry-helpers.ts`. For each entry:
   - Skip if `cost` is null, undefined, or 0 (no cost = no row)
   - Skip if `isIdea` is true (only confirmed plan entries appear in cost breakdown)
   - Extract `attendeeIds` from the entry (cast to `{ attendeeIds?: string[] }` since the field is added by the attendees feature)
   - If `attendeeIds` is empty (no attendees selected), **treat all trip members as attendees** — this is the sensible default (everyone splits the cost unless specific attendees are marked)
   - Create a `CostRow` with the entry's id, type, name, totalCost, date, attendeeIds, and the raw entry object

2. **Sort rows** by date ascending (null dates at the end), then by type alphabetically as a tiebreaker.

3. **Build member columns** from the `members` array. Map each member to their `userId` and `user.name`. Order: owner first, then alphabetically by name.

4. **Compute totals** per member: iterate rows, for each row divide `totalCost` by `attendeeIds.length`, add the share to each attendee's running total.

5. Return `{ rows, memberIds, memberNames, totals }`.

### `getUserShare(row, userId)` helper

Returns the user's share for a given row, or `null` if they are not an attendee:

```ts
export function getUserShare(row: CostRow, userId: string): number | null {
  if (!row.attendeeIds.includes(userId)) return null;
  return row.totalCost / row.attendeeIds.length;
}
```

---

## 4. Main Component — `CostBreakdown`

**New file:** `src/components/trip/CostBreakdown.tsx`

A `'use client'` component that renders the full page: header, scrollable grid, and entry detail popover.

### Data Fetching

Use the existing hooks (already cached by React Query, no new API calls needed):

```ts
const { data: trip, isLoading: tripLoading } = useTrip(tripId);
const { data: entries, isLoading: entriesLoading } = useEntries(tripId);
const { data: members, isLoading: membersLoading } = useMembers(tripId);
```

Compute the grid once data is loaded:

```ts
const grid = useMemo(() => {
  if (!entries || !members) return null;
  return buildCostGrid(entries, members);
}, [entries, members]);
```

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  TripHeader (reused)                                │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐│
│  │  Cost Breakdown Grid (scrollable)               ││
│  │                                                 ││
│  │  ┌──────────┬──────┬──────┬──────┬──────┐      ││
│  │  │ Entry    │ Alice│ Bob  │ Carol│ Dave │      ││
│  │  ├──────────┼──────┼──────┼──────┼──────┤      ││
│  │  │ ✈ Delta  │$75.00│      │$75.00│      │      ││
│  │  │   1234   │      │      │      │      │      ││
│  │  ├──────────┼──────┼──────┼──────┼──────┤      ││
│  │  │ 🏨 Hilton│$62.50│$62.50│$62.50│$62.50│      ││
│  │  ├──────────┼──────┼──────┼──────┼──────┤      ││
│  │  │ 🍽 Sushi │$25.00│$25.00│      │$25.00│      ││
│  │  │   Place  │      │      │      │      │      ││
│  │  ├──────────┼──────┼──────┼──────┼──────┤      ││
│  │  │ TOTAL    │162.50│ 87.50│137.50│ 87.50│      ││
│  │  └──────────┴──────┴──────┴──────┴──────┘      ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### Component Structure

The `CostBreakdown` component renders:

1. **TripHeader** — reuse the existing `TripHeader` component for consistent navigation. Pass the trip, member count, and entry count as usual.

2. **Grid container** — a `<div>` with `overflow-x-auto` for horizontal scroll on mobile/narrow screens. The grid itself is an HTML `<table>` for proper alignment semantics.

3. **Table header** — sticky top row with member names. The first column header is "Entry". Each subsequent column is a member name, truncated with `max-w-[100px] truncate`.

4. **Table body** — one row per `CostRow`. The first cell is the entry name (clickable). Remaining cells show the formatted share or are blank.

5. **Total footer row** — sticky bottom row with bold totals per member.

6. **Entry detail popover** — shown when clicking an entry name (see Section 5).

### Table Styling

- Container: `glass rounded-xl border border-sand-200 bg-white shadow-sm mx-4 my-4 lg:mx-8 lg:my-6`
- Table: `w-full text-sm`
- Header row: `bg-sand-50 sticky top-0 z-10`
- Header cells: `px-3 py-2 text-left text-xs font-semibold text-sand-600 uppercase tracking-wider`
- Body rows: `border-t border-sand-100 hover:bg-sand-50/50 transition-colors`
- Entry name cell (first column): `px-3 py-2.5 font-medium text-sand-800 cursor-pointer hover:text-ocean-600 transition-colors whitespace-nowrap`
  - Include a small colored dot (4px circle, using `ENTRY_COLORS[type]`) before the name to indicate entry type
- Share cells: `px-3 py-2.5 text-right tabular-nums text-sand-700` — right-aligned for numeric readability
- Empty cells (user not an attendee): no content, no "$0.00"
- Total row: `border-t-2 border-sand-300 bg-sand-50 sticky bottom-0`
- Total cells: `px-3 py-2.5 text-right tabular-nums font-bold text-ocean-800`
- Total label (first column): `px-3 py-2.5 font-bold text-sand-800 uppercase text-xs tracking-wider`

### Currency Formatting

Reuse the existing `formatCost()` from `src/components/trip/EntryDetails.tsx`. It already uses `Intl.NumberFormat` with USD currency formatting.

### Empty State

If no entries have costs, show a centered empty state:

```tsx
<div className="flex flex-col items-center justify-center py-16 text-sand-500">
  <svg ...dollar-sign-icon... />
  <p className="mt-2 text-lg font-medium">No costs to show</p>
  <p className="text-sm">Add costs to your plan entries to see the breakdown here.</p>
</div>
```

### Loading State

Show `<LoadingSpinner size="lg" />` centered (same pattern as `TripDetailLayout`).

### Mobile Responsiveness

- The outer table container uses `overflow-x-auto` so the table scrolls horizontally on small screens
- The entry name column (first column) should be sticky-left (`sticky left-0 bg-white z-[5]`) so it remains visible while scrolling horizontally through member columns
- On mobile (< 1024px), member name columns use `min-w-[80px]` to prevent excessive squishing
- The TripHeader handles its own responsive layout already

---

## 5. Entry Detail Popover Component

**New file:** `src/components/trip/CostEntryPopover.tsx`

A small popup that appears when clicking an entry name in the cost grid. Uses the existing `Modal` component pattern but could also be a positioned popover.

**Decision: Use the existing `Modal` component** for consistency and simplicity (it already handles escape-to-close, backdrop click, portal, focus management, scroll lock).

### Props

```ts
type Props = {
  row: CostRow;
  members: MemberWithUser[];
  isOpen: boolean;
  onClose: () => void;
};
```

### Content

The modal title is the entry name (from `row.name`). The body shows:

1. **Type badge** — a small pill showing the entry type label (from `ENTRY_LABELS`) with the entry type's color as background

2. **Total cost** — `formatCost(row.totalCost)` displayed prominently

3. **Date/time** — formatted using the existing `formatDatetime()` or `formatDate()` helpers from `EntryDetails.tsx`, choosing the appropriate date field based on entry type:
   - Flight: departure date (`formatDatetime`)
   - Lodging: check-in date (`formatDatetime`)
   - CarRental: pickup date (`formatDatetime`)
   - Restaurant: date (`formatDate`) + time (if available)
   - Activity: date (`formatDate`) + startTime–endTime (if available)

4. **Attendees list** — resolve `row.attendeeIds` to member names using the `members` array. Display as a comma-separated list or small pills (reuse the attendee pill styling from the attendees plan: `bg-ocean-50 text-ocean-700 rounded-full px-2 py-0.5 text-xs`).

5. **Per-person share** — `formatCost(row.totalCost / row.attendeeIds.length)` shown as "Per person: $XX.XX"

### Layout

```
┌───────────────────────────────────┐
│  Hilton Downtown              ✕   │
├───────────────────────────────────┤
│  [Lodging]                        │
│                                   │
│  Total Cost    $250.00            │
│  Per Person    $62.50             │
│  Check-in     Mar 15, 2026 3:00PM│
│  Check-out    Mar 18, 2026 11:00AM│
│                                   │
│  Attendees                        │
│  [Alice] [Bob] [Carol] [Dave]     │
└───────────────────────────────────┘
```

Use the `Row` component from `EntryDetails.tsx` for the label-value pairs.

---

## 6. Middleware — Protect the New Route

**File:** `src/middleware.ts`

The existing middleware already protects `/trips` routes. Verify that `/trips/[tripId]/costs` is covered by the existing matcher pattern. The current middleware config likely uses:

```ts
matcher: ['/dashboard/:path*', '/trips/:path*', '/settings/:path*']
```

Since `/trips/[tripId]/costs` falls under `/trips/:path*`, **no middleware changes should be needed**. Verify this during implementation.

---

## 7. Update `SegmentedNav` or Keep Separate?

**Decision: Do NOT add Cost Breakdown to the SegmentedNav.**

The segmented nav (Ideas / Planner / Timeline) represents the three core *views* of trip data. Cost Breakdown is a utility/settings page, not a data view. The button in the TripHeader action area is the right access point. This keeps the nav clean and avoids overcrowding.

---

## 8. File Summary

| File | Action | Description |
|------|--------|-------------|
| `src/app/trips/[tripId]/costs/page.tsx` | **New** | Route page component |
| `src/lib/cost-breakdown-utils.ts` | **New** | Pure functions: `buildCostGrid()`, `getUserShare()`, types |
| `src/components/trip/CostBreakdown.tsx` | **New** | Main page component with grid table |
| `src/components/trip/CostEntryPopover.tsx` | **New** | Entry detail modal/popover |
| `src/components/trip/TripHeader.tsx` | **Edit** | Add "Cost Breakdown" link button |

**No new API routes needed.** All data is already available via existing `useTrip`, `useEntries`, and `useMembers` hooks.

**No Prisma schema changes.** The `cost` field already exists on all entry models. The `attendeeIds` field is added by the attendees plan.

---

## 9. Detailed Implementation Steps

### Step 1: Create `src/lib/cost-breakdown-utils.ts`

Define the `CostRow` and `CostGrid` types. Implement `buildCostGrid()`:

```ts
import type { Flight, Lodging, CarRental, Restaurant, Activity } from '@prisma/client';
import type { EntryType } from '@/types';
import type { EntriesData } from '@/hooks/useEntries';
import type { MemberWithUser } from '@/hooks/useMembers';
import { getEntryName, getEntryDate } from '@/lib/entry-helpers';

export type CostRow = {
  id: string;
  type: EntryType;
  name: string;
  totalCost: number;
  date: Date | null;
  attendeeIds: string[];
  entry: Flight | Lodging | CarRental | Restaurant | Activity;
};

export type CostGrid = {
  rows: CostRow[];
  memberIds: string[];
  memberNames: Record<string, string>;
  totals: Record<string, number>;
};

export function buildCostGrid(entries: EntriesData, members: MemberWithUser[]): CostGrid {
  const allMemberIds = members.map(m => m.userId);

  // 1. Flatten all entry types into CostRow[]
  const rows: CostRow[] = [];

  const typeMap: { key: keyof EntriesData; type: EntryType }[] = [
    { key: 'flights', type: 'flight' },
    { key: 'lodgings', type: 'lodging' },
    { key: 'carRentals', type: 'carRental' },
    { key: 'restaurants', type: 'restaurant' },
    { key: 'activities', type: 'activity' },
  ];

  for (const { key, type } of typeMap) {
    for (const entry of entries[key]) {
      const cost = (entry as { cost?: number | null }).cost;
      if (!cost || cost <= 0) continue;
      if ((entry as { isIdea?: boolean }).isIdea) continue;

      const rawAttendees = (entry as { attendeeIds?: string[] }).attendeeIds ?? [];
      // Default: if no attendees selected, all members split the cost
      const attendeeIds = rawAttendees.length > 0 ? rawAttendees : allMemberIds;

      rows.push({
        id: entry.id,
        type,
        name: getEntryName(type, entry),
        totalCost: cost,
        date: getEntryDate(type, entry),
        attendeeIds,
        entry,
      });
    }
  }

  // 2. Sort by date ascending, nulls last, then by type
  rows.sort((a, b) => {
    if (a.date && b.date) return a.date.getTime() - b.date.getTime();
    if (a.date && !b.date) return -1;
    if (!a.date && b.date) return 1;
    return a.type.localeCompare(b.type);
  });

  // 3. Build member columns — owner first, then alphabetical
  const ownerMember = members.find(m => m.role === 'OWNER');
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === 'OWNER') return -1;
    if (b.role === 'OWNER') return 1;
    return a.user.name.localeCompare(b.user.name);
  });
  const memberIds = sortedMembers.map(m => m.userId);
  const memberNames: Record<string, string> = {};
  for (const m of members) {
    memberNames[m.userId] = m.user.name;
  }

  // 4. Compute totals
  const totals: Record<string, number> = {};
  for (const id of memberIds) totals[id] = 0;

  for (const row of rows) {
    const share = row.totalCost / row.attendeeIds.length;
    for (const uid of row.attendeeIds) {
      if (totals[uid] !== undefined) {
        totals[uid] += share;
      }
    }
  }

  return { rows, memberIds, memberNames, totals };
}

export function getUserShare(row: CostRow, userId: string): number | null {
  if (!row.attendeeIds.includes(userId)) return null;
  return row.totalCost / row.attendeeIds.length;
}
```

### Step 2: Create `src/components/trip/CostEntryPopover.tsx`

```tsx
'use client';

import { Modal } from '@/components/ui/Modal';
import { formatCost, formatDate, formatDatetime } from '@/components/trip/EntryDetails';
import { ENTRY_LABELS, ENTRY_COLORS } from '@/lib/constants';
import type { CostRow } from '@/lib/cost-breakdown-utils';
import type { MemberWithUser } from '@/hooks/useMembers';
import type { Flight, Lodging, CarRental, Restaurant, Activity } from '@prisma/client';

type Props = {
  row: CostRow;
  members: MemberWithUser[];
  isOpen: boolean;
  onClose: () => void;
};

export function CostEntryPopover({ row, members, isOpen, onClose }: Props) {
  const perPerson = row.totalCost / row.attendeeIds.length;

  // Resolve attendee IDs to names
  const attendeeNames = row.attendeeIds
    .map(id => members.find(m => m.userId === id)?.user.name)
    .filter(Boolean) as string[];

  // Get date/time display based on entry type
  const dateDisplay = getDateDisplay(row);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={row.name}>
      <div className="flex flex-col gap-3">
        {/* Type badge */}
        <span
          className="inline-flex self-start items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: ENTRY_COLORS[row.type] }}
        >
          {ENTRY_LABELS[row.type]}
        </span>

        {/* Cost info */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-sm">
            <span className="text-sand-500">Total Cost</span>
            <span className="font-semibold text-sand-800">{formatCost(row.totalCost)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-sand-500">Per Person</span>
            <span className="font-semibold text-ocean-700">{formatCost(perPerson)}</span>
          </div>
        </div>

        {/* Date/time */}
        {dateDisplay && (
          <div className="flex flex-col gap-1 text-sm">
            {dateDisplay.map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-sand-500">{label}</span>
                <span className="text-sand-700">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Attendees */}
        <div>
          <p className="text-xs font-semibold text-sand-500 uppercase tracking-wider mb-1.5">
            Attendees ({attendeeNames.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {attendeeNames.map((name, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-ocean-50 text-ocean-700"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
```

The `getDateDisplay(row)` helper is a private function in the same file that switches on `row.type` and returns an array of `{ label, value }` objects using the existing date formatting functions. For example:
- Flight → `[{ label: "Departure", value: formatDatetime(f.departureDate) }, { label: "Arrival", value: formatDatetime(f.arrivalDate) }]`
- Lodging → `[{ label: "Check-in", value: formatDatetime(l.checkIn) }, { label: "Check-out", value: formatDatetime(l.checkOut) }]`
- CarRental → `[{ label: "Pickup", value: formatDatetime(c.pickupDate) }, { label: "Drop-off", value: formatDatetime(c.dropoffDate) }]`
- Restaurant → `[{ label: "Date", value: formatDate(r.date) }, { label: "Time", value: r.time }]` (only include Time if non-null)
- Activity → `[{ label: "Date", value: formatDate(a.date) }, { label: "Time", value: a.startTime + "–" + a.endTime }]` (only include Time if non-null)

### Step 3: Create `src/components/trip/CostBreakdown.tsx`

The main component. Manages state for which entry popover is open.

```tsx
'use client';

import { useMemo, useState } from 'react';
import { useTrip } from '@/hooks/useTrips';
import { useEntries } from '@/hooks/useEntries';
import { useMembers } from '@/hooks/useMembers';
import { TripHeader } from './TripHeader';
import { CostEntryPopover } from './CostEntryPopover';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { buildCostGrid, getUserShare } from '@/lib/cost-breakdown-utils';
import type { CostRow } from '@/lib/cost-breakdown-utils';
import { formatCost } from '@/components/trip/EntryDetails';
import { ENTRY_COLORS } from '@/lib/constants';

type Props = { tripId: string };

export function CostBreakdown({ tripId }: Props) {
  const { data: trip, isLoading: tripLoading } = useTrip(tripId);
  const { data: entries, isLoading: entriesLoading } = useEntries(tripId);
  const { data: members, isLoading: membersLoading } = useMembers(tripId);
  const [selectedRow, setSelectedRow] = useState<CostRow | null>(null);

  const grid = useMemo(() => {
    if (!entries || !members) return null;
    return buildCostGrid(entries, members);
  }, [entries, members]);

  // Loading state
  if (tripLoading || entriesLoading || membersLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error / not found
  if (!trip) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Trip not found or you don&apos;t have access.</p>
      </div>
    );
  }

  const memberCount = trip.members.length;

  return (
    <div className="flex h-screen flex-col">
      <TripHeader trip={trip} memberCount={memberCount} />

      <div className="flex-1 overflow-auto p-4 lg:p-8">
        {!grid || grid.rows.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 text-sand-500">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2 text-lg font-medium">No costs to show</p>
            <p className="text-sm">Add costs to your plan entries to see the breakdown here.</p>
          </div>
        ) : (
          /* Cost grid table */
          <div className="glass rounded-xl border border-sand-200 bg-white shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sand-50 border-b border-sand-200">
                  <th className="sticky left-0 z-10 bg-sand-50 px-4 py-3 text-left text-xs font-semibold text-sand-600 uppercase tracking-wider">
                    Entry
                  </th>
                  {grid.memberIds.map(uid => (
                    <th key={uid} className="px-3 py-3 text-right text-xs font-semibold text-sand-600 uppercase tracking-wider">
                      <span className="block max-w-[100px] truncate ml-auto">
                        {grid.memberNames[uid]}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.rows.map(row => (
                  <tr key={row.id} className="border-t border-sand-100 hover:bg-sand-50/50 transition-colors">
                    <td
                      className="sticky left-0 z-[5] bg-white px-4 py-2.5 font-medium text-sand-800 cursor-pointer hover:text-ocean-600 transition-colors whitespace-nowrap"
                      onClick={() => setSelectedRow(row)}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: ENTRY_COLORS[row.type] }}
                        />
                        {row.name}
                      </span>
                    </td>
                    {grid.memberIds.map(uid => {
                      const share = getUserShare(row, uid);
                      return (
                        <td key={uid} className="px-3 py-2.5 text-right tabular-nums text-sand-700">
                          {share != null ? formatCost(share) : ''}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-sand-300 bg-sand-50">
                  <td className="sticky left-0 z-[5] bg-sand-50 px-4 py-3 font-bold text-sand-800 uppercase text-xs tracking-wider">
                    Total
                  </td>
                  {grid.memberIds.map(uid => (
                    <td key={uid} className="px-3 py-3 text-right tabular-nums font-bold text-ocean-800">
                      {formatCost(grid.totals[uid]) || '$0.00'}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Entry detail popover */}
      {selectedRow && members && (
        <CostEntryPopover
          row={selectedRow}
          members={members}
          isOpen={!!selectedRow}
          onClose={() => setSelectedRow(null)}
        />
      )}
    </div>
  );
}
```

### Step 4: Create route page `src/app/trips/[tripId]/costs/page.tsx`

```tsx
import { CostBreakdown } from '@/components/trip/CostBreakdown';

export default function CostsPage({ params }: { params: { tripId: string } }) {
  return <CostBreakdown tripId={params.tripId} />;
}
```

### Step 5: Update `TripHeader.tsx`

Add a `Link` import and insert the Cost Breakdown button:

```tsx
// Add to imports:
import Link from 'next/link';

// Insert before the Share button (line ~102), inside the action buttons div:
<Link href={`/trips/${trip.id}/costs`}>
  <Button variant="secondary" size="sm">
    Cost Breakdown
  </Button>
</Link>
```

---

## 10. Export Considerations

The `formatCost`, `formatDate`, and `formatDatetime` functions in `src/components/trip/EntryDetails.tsx` are currently exported but used as component-level helpers. They will now be imported by `CostBreakdown.tsx` and `CostEntryPopover.tsx`. No changes needed — they are already properly exported.

---

## 11. Unit Tests

**New file:** `tests/unit/cost-breakdown-utils.test.ts`

Test the pure `buildCostGrid()` and `getUserShare()` functions:

### Test cases for `buildCostGrid()`:

1. **Empty entries** → returns `{ rows: [], totals: {} }` (all member totals are 0)
2. **Entries without costs** → excluded from rows
3. **Idea entries** → excluded from rows (only `isIdea: false`)
4. **Single entry, all members attend** → each member's share = totalCost / memberCount
5. **Single entry, subset of members** → only attendees get a share, non-attendees excluded
6. **Entry with empty attendeeIds** → defaults to all members splitting
7. **Multiple entries, mixed attendees** → totals correctly sum per member
8. **Sort order** → entries sorted by date ascending, nulls last
9. **Member ordering** → owner first, then alphabetical

### Test cases for `getUserShare()`:

1. **User is attendee** → returns `totalCost / attendeeIds.length`
2. **User is not attendee** → returns `null`

Use the existing test fixtures from `tests/fixtures.ts` to construct entry data. The fixtures will need the `attendeeIds` field (added by the attendees plan).

---

## 12. Dependencies

This feature **requires the attendees feature** (from `plans/attendees_plan.md`) to be implemented first. Specifically:

- The `attendeeIds: String[]` field on all 5 entry models (Flight, Lodging, CarRental, Restaurant, Activity)
- The corresponding migration
- The field being included in API responses

Without the attendees feature, `buildCostGrid()` will treat every entry as "all members attend" (the `attendeeIds ?? []` fallback), which is still functional but less useful. The cost breakdown page can technically be built first and will work correctly in this degraded mode — it just won't have per-entry attendee granularity.

---

## Verification

1. **Build:** `npm run build` compiles without errors
2. **Tests:** `npm run test` passes (new unit tests for cost-breakdown-utils)
3. **Manual E2E:**
   - Navigate to a trip → verify "Cost Breakdown" button appears in header for all roles
   - Click "Cost Breakdown" → page loads with grid
   - Verify entries without costs are not shown
   - Verify idea entries are not shown
   - Verify each cell shows `totalCost / attendeeCount` for attendees, blank for non-attendees
   - Verify the TOTAL row sums correctly per member
   - Click an entry name → verify popover shows name, type badge, total cost, per-person cost, date/time, and attendee pills
   - Close popover with X button, Escape key, or backdrop click
   - Test with 0 entries with costs → verify empty state
   - Test horizontal scroll on mobile with many members
   - Verify sticky first column stays visible during horizontal scroll
   - Verify the page is accessible (keyboard navigation, screen reader)
