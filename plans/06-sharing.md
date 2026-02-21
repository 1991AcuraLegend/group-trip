# WS 6 — Sharing & Member Management

> **Depends on:** WS 0 (Bootstrap)
> **Can parallelize with:** WS 1–5
> **Merge order:** 7th (last — depends on trips + auth being in place)

---

## Overview

Implement trip sharing via unique share codes/links, the join flow for invited users, and member management (list members, remove members, role-based permissions). This is the final workstream — it integrates with the trip system and auth.

---

## Files to Create

### 1. Share API Routes

#### `src/app/api/trips/[tripId]/share/route.ts`

**POST** — Generate or regenerate share link:
1. `withAuth()` to get session
2. Verify user is trip **owner** (only owners can generate share links)
3. Generate a new share code using `generateShareCode()` from `src/lib/share-codes.ts`
4. Update trip's `shareCode` field
5. Return `{ shareCode, shareUrl: '${NEXTAUTH_URL}/join/${shareCode}' }`

**GET** — Get current share info:
1. `withAuth()` to get session
2. Verify user is a trip member
3. Return `{ shareCode: trip.shareCode, shareUrl, memberCount }`

---

#### `src/app/api/trips/[tripId]/members/route.ts`

**GET** — List trip members:
1. `withAuth()` + verify membership
2. Fetch all TripMember records with user data (name, email)
3. Return `members[]` with role info

---

#### `src/app/api/trips/[tripId]/members/[memberId]/route.ts`

**DELETE** — Remove a member:
1. `withAuth()` to get session
2. Verify the requester is the trip **owner**
3. Cannot remove the owner themselves
4. Delete the TripMember record
5. Return 204

---

#### `src/app/api/join/[code]/route.ts`

**POST** — Join trip via share code:
1. `withAuth()` to get session (must be logged in to join)
2. Look up trip by `shareCode`
3. 404 if no trip with that code
4. Check if user is already a member → 409 "Already a member"
5. Create TripMember with role `COLLABORATOR`
6. Return the trip (so frontend can redirect to it)

**GET** — Get trip info for share code (preview before joining):
1. `withAuth()` to get session
2. Look up trip by `shareCode`
3. Return basic trip info: `{ tripId, name, description, ownerName, memberCount }`
4. Also return `{ alreadyMember: boolean }` so UI can show appropriate state

---

### 2. Join Page

#### `src/app/join/[code]/page.tsx`

Server component that renders the join UI:

```tsx
- Reads share code from params
- Renders <JoinTripPage code={code} />
```

#### `src/components/sharing/JoinTripPage.tsx`

```tsx
'use client';

Props: code (string)

1. On mount, GET /api/join/{code} to fetch trip preview
2. Display:
   - Trip name and description
   - Owner name
   - Member count
   - "Join Trip" button
3. States:
   - Loading: spinner
   - Invalid code: "This share link is invalid or has expired"
   - Already a member: "You're already a member of this trip" + link to trip
   - Not logged in: redirect to /login?callbackUrl=/join/{code}
4. On "Join Trip" click:
   - POST /api/join/{code}
   - On success: redirect to /trips/{tripId}
   - On error: show error message
```

---

### 3. Share Modal

#### `src/components/sharing/ShareModal.tsx`

```tsx
Props: tripId (string), isOpen (boolean), onClose

Sections:
1. **Share Link**
   - If no share code exists: "Generate Share Link" button
   - If share code exists: display link with copy button
   - "Regenerate" button (warns: old link stops working)
   - Copy-to-clipboard button with "Copied!" feedback

2. **Members List**
   - Renders <MemberList tripId={tripId} />

Uses:
- POST /api/trips/{tripId}/share to generate link
- GET /api/trips/{tripId}/share to get current share info
```

#### `src/components/sharing/MemberList.tsx`

```tsx
Props: tripId (string), isOwner (boolean)

- Fetches members using useMembers(tripId) hook
- Displays list of members:
  - Avatar placeholder (initials circle)
  - Name + email
  - Role badge: "Owner" (blue) or "Collaborator" (gray)
  - Remove button (X) — only shown for owner, not on owner's own row
- Remove confirmation dialog
```

---

### 4. Member Query Hook

#### `src/hooks/useMembers.ts`

```ts
export const memberKeys = {
  all: (tripId: string) => ['trips', tripId, 'members'] as const,
};

export function useMembers(tripId: string) {
  return useQuery({
    queryKey: memberKeys.all(tripId),
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/members`);
      if (!res.ok) throw new Error('Failed to fetch members');
      return res.json();
    },
  });
}

export function useRemoveMember(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      const res = await fetch(`/api/trips/${tripId}/members/${memberId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove member');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all(tripId) });
    },
  });
}

export function useShareInfo(tripId: string) {
  return useQuery({
    queryKey: ['trips', tripId, 'share'],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/share`);
      if (!res.ok) throw new Error('Failed to fetch share info');
      return res.json();
    },
  });
}

export function useGenerateShareLink(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/share`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to generate share link');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', tripId, 'share'] });
    },
  });
}

export function useJoinTrip() {
  return useMutation({
    mutationFn: async (code: string) => {
      const res = await fetch(`/api/join/${code}`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to join trip');
      }
      return res.json();
    },
  });
}
```

---

### 5. Integration Points

After WS 6 merges, update these files from other workstreams:

#### `src/components/trip/TripHeader.tsx` (from WS 4)
Replace the disabled "Share" button with:
```tsx
<Button variant="secondary" onClick={() => setShareModalOpen(true)}>Share</Button>
<ShareModal tripId={tripId} isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)} />
```

#### Permission checks throughout
After merge, all API routes that check `getTripMembership()` already enforce that only members can access trip data. The share system adds a new way to become a member.

---

## Role-Based Permission Summary

| Action | Owner | Collaborator | Non-member |
|--------|-------|-------------|------------|
| View trip & entries | Yes | Yes | No |
| Create entries | Yes | Yes | No |
| Edit entries | Yes | Yes | No |
| Delete entries | Yes | Yes | No |
| Edit trip details | Yes | Yes | No |
| Delete trip | Yes | No | No |
| Generate share link | Yes | No | No |
| Remove members | Yes | No | No |
| Join via share link | — | — | Yes (becomes collaborator) |

---

## Interface Contracts

### What this workstream exports:

| Export | Path | Used by |
|--------|------|---------|
| Share API routes | `src/app/api/trips/[tripId]/share/` | ShareModal |
| Members API routes | `src/app/api/trips/[tripId]/members/` | MemberList |
| Join API route | `src/app/api/join/[code]/` | JoinTripPage |
| `<ShareModal>` | `src/components/sharing/ShareModal.tsx` | WS 4 trip header |
| `<MemberList>` | `src/components/sharing/MemberList.tsx` | ShareModal |
| `<JoinTripPage>` | `src/components/sharing/JoinTripPage.tsx` | Join page |
| `useMembers()` | `src/hooks/useMembers.ts` | ShareModal, MemberList |
| `useJoinTrip()` | `src/hooks/useMembers.ts` | JoinTripPage |

### What this workstream consumes:

| Dependency | From | Notes |
|-----------|------|-------|
| `prisma` | WS 0 | Database queries |
| `generateShareCode()` | WS 0 | Share code generation |
| `withAuth()` | WS 1 | Auth guard |
| `getTripMembership()`, `isTripOwner()` | WS 2 | Trip access checks |
| `<Button>`, `<Input>`, `<Modal>` | WS 1, 2 | UI components |
| `tripKeys` | WS 2 | Query invalidation after join |

---

## Stubbing for Parallel Work

Until WS 1 merges:
- Stub auth: mock session with user id
- Skip login redirect on join page

Until WS 2 merges:
- Stub `getTripMembership()` and `isTripOwner()`
- Create a mock trip to test sharing against

---

## Verification Checklist

- [ ] Owner can generate a share link
- [ ] Share link is copyable to clipboard
- [ ] Share link URL format is correct: `/join/{code}`
- [ ] Regenerating a share code invalidates the old one
- [ ] Visiting a share link shows trip preview (name, description, owner)
- [ ] "Join Trip" button creates TripMember with COLLABORATOR role
- [ ] Already-member state is shown correctly
- [ ] Invalid share code shows error message
- [ ] Non-logged-in users are redirected to login, then back to join page
- [ ] Member list shows all members with correct roles
- [ ] Owner can remove collaborators
- [ ] Owner cannot remove themselves
- [ ] Collaborators cannot see "Remove" button
- [ ] Collaborators cannot generate/regenerate share links (403)
- [ ] After joining, user can see the trip on their dashboard
- [ ] After being removed, user can no longer access the trip
