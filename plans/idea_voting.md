# Idea Voting Feature

## Overview

Add "+1" voting to the ideas board. Any trip member (including viewers) can thumbs-up an idea. Each idea card shows a thumbs-up button in the bottom-left corner with a vote count to its right. A user can vote once per idea; clicking again removes their vote (toggle behavior).

## Design Decisions

- **Who can vote:** All trip members (VIEWER and above). Voting is read-like engagement, not a write operation on the entry itself, so viewers should participate.
- **Toggle behavior:** Clicking the thumbs-up when you've already voted removes your vote. This is the simplest UX and avoids needing a separate "unvote" action.
- **Data model:** A single `IdeaVote` table keyed by `(userId, entryId, entryType)`. Because entries are split across 5 tables, `entryType` is needed to identify which table the entry belongs to. The unique constraint prevents double-voting.
- **Vote counts returned with ideas:** The GET ideas endpoint will include vote data (count + list of voter user IDs) so the client can render counts and highlight the current user's votes without extra requests.

---

## Step 1: Prisma Schema - Add `IdeaVote` Model

**File:** `prisma/schema.prisma`

Add a new model:

```prisma
model IdeaVote {
  id        String   @id @default(cuid())
  userId    String
  entryId   String
  entryType String   // "flight" | "lodging" | "carRental" | "restaurant" | "activity"
  tripId    String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  trip Trip @relation(fields: [tripId], references: [id], onDelete: Cascade)

  @@unique([userId, entryId, entryType])
  @@index([entryId, entryType])
  @@index([tripId])
}
```

Also add the reverse relation fields:
- `User` model: add `ideaVotes IdeaVote[]`
- `Trip` model: add `ideaVotes IdeaVote[]`

Then run `npx prisma migrate dev --name add-idea-votes`.

**Why a separate table instead of a JSON field on entries:** Proper relational modeling gives us unique constraints, efficient queries, cascade deletes, and the ability to query "who voted" without parsing JSON. It also avoids touching the 5 entry tables.

**Why `entryType` in the vote table:** Since entries live in 5 separate tables, `entryId` alone isn't globally unique. The `(entryId, entryType)` pair identifies an entry. The unique constraint `(userId, entryId, entryType)` prevents a user from voting twice on the same idea.

---

## Step 2: API Route - Toggle Vote

**New file:** `src/app/api/trips/[tripId]/entries/[entryId]/votes/route.ts`

### POST `/api/trips/[tripId]/entries/[entryId]/votes?type=flight`

Toggle vote (create if not exists, delete if exists). Requires VIEWER role.

```
Request: POST with query param ?type=flight|lodging|...
Response: { voted: boolean, voteCount: number }
```

Implementation:
1. `withTripAuth(tripId, 'VIEWER', ...)` - all members can vote
2. Validate `type` query param
3. Verify the entry exists in the correct table and belongs to this trip, and that `isIdea: true`
4. Check if a vote already exists for `(userId, entryId, entryType)`
   - If yes: delete it (unvote), return `{ voted: false, voteCount }`
   - If no: create it, return `{ voted: true, voteCount }`
5. Return the updated count from `prisma.ideaVote.count({ where: { entryId, entryType } })`

Single endpoint with toggle semantics is simpler than separate POST/DELETE routes and matches the thumbs-up UX.

---

## Step 3: Modify GET Ideas Endpoint to Include Vote Data

**File:** `src/app/api/trips/[tripId]/entries/route.ts`

After fetching ideas in the GET handler, also fetch all votes for this trip:

```ts
const votes = await prisma.ideaVote.findMany({
  where: { tripId },
  select: { entryId: true, entryType: true, userId: true },
});
```

Group votes by `entryId:entryType` and include in the response as a `votes` field:

```ts
// Response shape:
{
  flights: Flight[],
  lodgings: Lodging[],
  // ...
  votes: Record<string, { count: number; userIds: string[] }>
  // key = "entryId:entryType", e.g. "clxyz123:restaurant"
}
```

This avoids N+1 queries and gives the client everything it needs in a single fetch.

---

## Step 4: React Query Hook - `useToggleIdeaVote`

**File:** `src/hooks/useEntries.ts`

Add a new mutation hook:

```ts
export function useToggleIdeaVote(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ entryId, type }: { entryId: string; type: EntryType }) => {
      const res = await fetch(`/api/trips/${tripId}/entries/${entryId}/votes?type=${type}`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to toggle vote');
      return res.json() as Promise<{ voted: boolean; voteCount: number }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entryKeys.ideas(tripId) });
    },
  });
}
```

Cache invalidation on `entryKeys.ideas(tripId)` will refetch the ideas + votes data, keeping the UI in sync.

---

## Step 5: Update Types

**File:** `src/hooks/useEntries.ts`

Update the `EntriesData` type to include the votes map:

```ts
export type VoteMap = Record<string, { count: number; userIds: string[] }>;

export type EntriesData = {
  flights: Flight[];
  lodgings: Lodging[];
  carRentals: CarRental[];
  restaurants: Restaurant[];
  activities: Activity[];
  votes?: VoteMap;
};
```

The `votes` field is optional so the plan entries endpoint (which doesn't return votes) still conforms.

---

## Step 6: Update `IdeaCard` Component

**File:** `src/components/trip/IdeaCard.tsx`

### New props:
```ts
type Props = {
  entry: AnyEntry;
  type: EntryType;
  tripId: string;
  canEdit: boolean;
  voteCount: number;
  hasVoted: boolean;
};
```

### UI changes:

Add a vote row at the bottom of the card, **below the content area but above the "Move to Plan" button**. This places the thumbs-up in the bottom-left of the card body as requested:

```tsx
{/* Vote button - visible to all members */}
<div className="px-3 pb-2 flex items-center gap-1.5">
  <button
    onClick={handleVote}
    disabled={toggleVote.isPending}
    className={`p-1 rounded transition-colors ${
      hasVoted
        ? 'text-ocean-600 bg-ocean-50'
        : 'text-sand-400 hover:text-ocean-600 hover:bg-ocean-50'
    } disabled:opacity-50`}
    title={hasVoted ? 'Remove vote' : 'Vote for this idea'}
  >
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill={hasVoted ? 'currentColor' : 'none'} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z M4 21h-1a2 2 0 01-2-2v-7a2 2 0 012-2h1" />
    </svg>
  </button>
  {voteCount > 0 && (
    <span className={`text-xs font-medium ${hasVoted ? 'text-ocean-600' : 'text-sand-400'}`}>
      {voteCount}
    </span>
  )}
</div>
```

The thumbs-up icon is filled when the user has voted, outlined when not. The count appears to the right of the icon.

### Hook usage in the component:

```ts
const toggleVote = useToggleIdeaVote(tripId);

async function handleVote() {
  await toggleVote.mutateAsync({ entryId: entry.id, type });
}
```

---

## Step 7: Wire Vote Data Through `IdeasLayout`

**File:** `src/components/trip/IdeasLayout.tsx`

The `useIdeas` hook already returns `EntriesData` which will now include `votes`. Pass vote info to each `IdeaCard`:

```tsx
// In IdeasLayout or IdeaColumn:
const votes = ideas?.votes ?? {};

// When rendering IdeaCard:
const voteKey = `${entry.id}:${type}`;
const voteData = votes[voteKey];

<IdeaCard
  entry={entry}
  type={type}
  tripId={tripId}
  canEdit={canEdit}
  voteCount={voteData?.count ?? 0}
  hasVoted={voteData?.userIds.includes(session?.user?.id ?? '') ?? false}
/>
```

The `votes` map and `session.user.id` need to be threaded from `IdeasLayout` down through `IdeaColumn` / `MobileIdeas` to `IdeaCard`. The cleanest way is to pass `votes` and `userId` as props to `IdeaColumn` and `MobileIdeas`, then compute per-card inside those components.

---

## Step 8: Handle Cascade Deletes

When a trip is deleted, the `onDelete: Cascade` on `IdeaVote.trip` handles cleanup automatically.

When an individual entry is deleted, votes for that entry need cleanup. Add a step to the existing DELETE handler in `src/app/api/trips/[tripId]/entries/[entryId]/route.ts`:

```ts
// Before deleting the entry:
await prisma.ideaVote.deleteMany({
  where: { entryId, entryType: type },
});
```

This ensures no orphaned vote records remain.

---

## File Change Summary

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add `IdeaVote` model, add relations to `User` and `Trip` |
| `src/app/api/trips/[tripId]/entries/[entryId]/votes/route.ts` | **New** - POST toggle vote endpoint |
| `src/app/api/trips/[tripId]/entries/route.ts` | Modify GET to include vote data |
| `src/app/api/trips/[tripId]/entries/[entryId]/route.ts` | Modify DELETE to clean up votes |
| `src/hooks/useEntries.ts` | Add `useToggleIdeaVote` hook, update `EntriesData` type |
| `src/components/trip/IdeaCard.tsx` | Add vote button UI, accept new props |
| `src/components/trip/IdeasLayout.tsx` | Thread vote data and userId to `IdeaCard` |

## Testing

- Verify a user can vote on an idea and the count increments
- Verify clicking again removes the vote (toggle)
- Verify the vote persists across page reloads
- Verify viewers can vote but cannot edit entries
- Verify vote count is visible to all trip members
- Verify deleting an idea cleans up its votes
- Verify deleting a trip cascades to votes
- Verify a user cannot vote twice on the same idea (unique constraint)
