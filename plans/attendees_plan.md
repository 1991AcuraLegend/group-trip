# Attendees Feature: Implementation Plan

## Context

Not every trip member attends every event. This plan adds an "Attendees" multi-select field to all entry add/edit forms (positioned above Notes), allowing users to tag which trip members will be at each event. The field is populated from the trip's member list.

---

## 1. Prisma Schema — Add `attendeeIds` to All 5 Entry Models

**File:** `prisma/schema.prisma`

Add `attendeeIds String[] @default([])` to each model: **Flight** (after `notes`), **Lodging**, **CarRental**, **Restaurant**, **Activity**.

PostgreSQL supports `String[]` natively. Using an array of user IDs (rather than 5 join tables) keeps the schema simple. The client already fetches members via `useMembers(tripId)` so it can resolve IDs to names.

**Run migration:** `npx prisma migrate dev --name add-attendee-ids`

---

## 2. Zod Validators — Add `attendeeIds` to Shared Base Fields

**File:** `src/validators/entry.ts`

Add to `baseEntryFields`:
```ts
attendeeIds: z.array(z.string()).optional().default([]),
```

Since `baseEntryFields` is spread into all 10 schemas (5 plan + 5 idea), this single change propagates to every schema and both discriminated unions. Existing clients that omit the field get `[]` via default.

---

## 3. API Routes — No Changes Needed

- **POST** (`src/app/api/trips/[tripId]/entries/route.ts`): Destructures `{ type, ...data }` and passes `data` to Prisma. `attendeeIds` flows through automatically.
- **PATCH** (`src/app/api/trips/[tripId]/entries/[entryId]/route.ts`): Uses `.partial()` on the create schema, so `attendeeIds` becomes optional in updates.
- **GET**: `findMany` returns all columns including the new `attendeeIds`.

---

## 4. New Component — `AttendeeSelect`

**New file:** `src/components/trip/forms/AttendeeSelect.tsx`

A reusable multi-select dropdown used by all 10 forms:

```tsx
type AttendeeSelectProps = {
  tripId: string;
  value: string[];           // current attendeeIds (userId[])
  onChange: (ids: string[]) => void;
  variant?: 'plan' | 'idea'; // controls styling
};
```

**Behavior:**
- Calls `useMembers(tripId)` internally (already cached by React Query)
- Renders a label "Attendees" styled to match existing form labels (`text-gray-700` for plan, `text-sand-700` for idea)
- Clickable area shows selected members as small pills with "x" to remove
- Dropdown (absolutely positioned, z-50) lists all trip members with checkboxes
- Clicking a member toggles their `userId` in the array
- Closes on outside click (same pattern as `AddressAutocomplete`)
- Empty state: "No attendees selected" placeholder
- Loading state: "Loading members..." while `useMembers` is fetching
- Dropdown has `max-h-48 overflow-y-auto` for scrollable list when many members

---

## 5. Update All 10 Form Components

Each form needs 4 changes:

### a. Add `attendeeIds` to local Zod schema
```ts
attendeeIds: z.array(z.string()).optional().default([]),
```

### b. Add to `defaultValues` (edit mode)
```ts
attendeeIds: existingEntry?.attendeeIds ?? [],
```

### c. Add to `onSubmit` payload
```ts
attendeeIds: data.attendeeIds ?? [],
```

### d. Insert `<AttendeeSelect>` JSX above the Notes field using `Controller`
```tsx
<Controller
  name="attendeeIds"
  control={control}
  render={({ field }) => (
    <AttendeeSelect
      tripId={tripId}
      value={field.value ?? []}
      onChange={field.onChange}
      variant="plan" // or "idea"
    />
  )}
/>
```

### Files and insertion points (insert above the Notes `<div>`):

| File | Notes field line | Variant | Already imports `Controller`? |
|------|-----------------|---------|-------------------------------|
| `forms/FlightForm.tsx` | 136 | plan | No (add import) |
| `forms/LodgingForm.tsx` | 106 | plan | Yes |
| `forms/CarRentalForm.tsx` | 122 | plan | Yes |
| `forms/RestaurantForm.tsx` | 127 | plan | Yes |
| `forms/ActivityForm.tsx` | 113 | plan | Yes |
| `forms/idea/FlightIdeaForm.tsx` | 74 | idea | No (add import) |
| `forms/idea/LodgingIdeaForm.tsx` | 83 | idea | Yes |
| `forms/idea/CarRentalIdeaForm.tsx` | 108 | idea | Yes |
| `forms/idea/RestaurantIdeaForm.tsx` | 90 | idea | Yes |
| `forms/idea/ActivityIdeaForm.tsx` | 91 | idea | Yes |

**Note:** `FlightForm` and `FlightIdeaForm` don't currently import `Controller` — it needs to be added to their `react-hook-form` import.

---

## 6. Display Attendees on Entry Cards

### EntryCard (plan entries)
**File:** `src/components/trip/EntryCard.tsx`

- Import and call `useMembers(tripId)` (cached, no extra fetch)
- Extract `attendeeIds` from entry: `(entry as { attendeeIds?: string[] }).attendeeIds ?? []`
- Resolve to names via `members?.find(m => m.userId === id)?.user.name`
- Render name pills between `<CardBody>` and the notes toggle:
```tsx
{attendeeNames.length > 0 && (
  <div className="flex flex-wrap gap-1 mt-1">
    {attendeeNames.map((name, i) => (
      <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-ocean-50 text-ocean-700">
        {name}
      </span>
    ))}
  </div>
)}
```

### IdeaCard (idea entries)
**File:** `src/components/trip/IdeaCard.tsx`

Same pattern, positioned after cost display (line 104), using idea styling: `bg-sand-100 text-sand-600`.

---

## 7. Clean Up Attendees on Member Removal

**File:** `src/app/api/trips/[tripId]/members/[memberId]/route.ts`

In the `DELETE` handler, after `prisma.tripMember.delete()` (line 60), add cleanup:

```ts
const userId = target.userId;
await Promise.all([
  prisma.$executeRaw`UPDATE "Flight" SET "attendeeIds" = array_remove("attendeeIds", ${userId}) WHERE "tripId" = ${tripId}`,
  prisma.$executeRaw`UPDATE "Lodging" SET "attendeeIds" = array_remove("attendeeIds", ${userId}) WHERE "tripId" = ${tripId}`,
  prisma.$executeRaw`UPDATE "CarRental" SET "attendeeIds" = array_remove("attendeeIds", ${userId}) WHERE "tripId" = ${tripId}`,
  prisma.$executeRaw`UPDATE "Restaurant" SET "attendeeIds" = array_remove("attendeeIds", ${userId}) WHERE "tripId" = ${tripId}`,
  prisma.$executeRaw`UPDATE "Activity" SET "attendeeIds" = array_remove("attendeeIds", ${userId}) WHERE "tripId" = ${tripId}`,
]);
```

Uses PostgreSQL's built-in `array_remove()` for atomic removal. Runs 5 parallel queries scoped to the trip.

---

## 8. Test Fixture Updates

**File:** `tests/fixtures.ts`

Add `attendeeIds: [],` to each factory (`makeFlight`, `makeLodging`, `makeCarRental`, `makeRestaurant`, `makeActivity`) to match the updated Prisma types.

---

## 9. Validator Test Updates

**File:** `tests/unit/validators-entry.test.ts`

Add tests to one representative plan schema (`createFlightSchema`) and one idea schema:
- Accepts `attendeeIds` as array of strings
- Defaults to `[]` when omitted
- Rejects non-string items

---

## Verification

1. **Migration:** `npx prisma migrate dev --name add-attendee-ids` succeeds
2. **Build:** `npm run build` compiles without errors
3. **Tests:** `npm run test` passes (fixtures and validator tests updated)
4. **Manual E2E:**
   - Create a trip with 2+ members
   - Add a new plan entry (any type) — verify the Attendees dropdown appears above Notes, shows all members
   - Select 2 members, save — verify pills appear on the entry card
   - Edit the entry — verify selected members are pre-populated
   - Add a new idea entry — verify Attendees field works with idea styling
   - Remove a member from the trip — verify their name disappears from entry cards
