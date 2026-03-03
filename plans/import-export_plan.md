# Import/Export Trip Functionality

## Context

Users want the ability to export a trip's planner entries as copyable text and import that text elsewhere to recreate the trip with all its data. This enables sharing trip plans outside the app's built-in sharing system — e.g., copying a trip template, migrating data, or sharing with someone on a different instance.

## Format Choice: JSON

JSON is the best fit here — it's native to the JS/TS stack (no dependencies), human-readable when pretty-printed, and trivially copy-pasteable. It also allows Zod validation on import for safety.

## Export JSON Structure

```json
{
  "version": 1,
  "trip": {
    "name": "Beach Vacation",
    "description": "Annual trip",
    "startDate": "2024-06-01T00:00:00.000Z",
    "endDate": "2024-06-07T00:00:00.000Z"
  },
  "entries": {
    "flights": [
      {
        "airline": "Delta",
        "flightNumber": "DL123",
        "departureDate": "2024-06-01T10:00:00.000Z",
        "arrivalDate": "2024-06-01T14:00:00.000Z",
        "departureCity": "New York",
        "arrivalCity": "Miami",
        "departureAirport": "JFK",
        "arrivalAirport": "MIA",
        "confirmationNum": "ABC123",
        "notes": "Window seat",
        "cost": 350
      }
    ],
    "lodgings": [],
    "carRentals": [],
    "restaurants": [],
    "activities": []
  }
}
```

**Included per entry:** all user-visible fields (dates, names, addresses, lat/lng, costs, notes, confirmation numbers, etc.)
**Excluded per entry:** `id`, `tripId`, `createdById`, `attendeeIds`, `isIdea`, `createdAt`, `updatedAt`
**Excluded from trip:** `coverImage` (local file path, not portable)
**Scope:** Planner entries only (`isIdea: false`)

## Implementation Plan

### 1. Export utility — `src/lib/trip-export.ts`

- `serializeTripForExport(trip, entries)` → returns JSON string
  - Strips internal fields (id, tripId, createdById, attendeeIds, isIdea, createdAt, updatedAt) from each entry
  - Includes trip name, description, startDate, endDate
  - Pretty-prints with 2-space indent
- Field stripping uses a shared `INTERNAL_FIELDS` set iterated over per entry, keeping it DRY across all 5 types

### 2. Export modal — `src/components/trip/ExportTripModal.tsx`

- Props: `isOpen`, `onClose`, `trip` (Trip), `tripId` (string)
- Fetches entries using `useEntries(tripId)` hook (already cached from the planner page)
- Calls `serializeTripForExport()` to generate JSON
- Renders the base `Modal` component with:
  - Read-only `<textarea>` with the JSON content, styled with monospace font
  - "Copy to Clipboard" button using `navigator.clipboard.writeText()`
  - Brief success feedback after copy (e.g., button text changes to "Copied!" for 2s)
- No server call needed — all data is already client-side

### 3. Wire export into trip header

**`src/components/trip/TripHeader.tsx`:**
- Add `const [exportOpen, setExportOpen] = useState(false)`
- Pass `onExport={() => setExportOpen(true)}` to `TripHeaderMenu`
- Add desktop inline button: `<Button variant="secondary" size="sm" onClick={...}>Export</Button>`
- Render `<ExportTripModal>` at bottom alongside existing modals

**`src/components/trip/TripHeaderMenu.tsx`:**
- Add `onExport` callback prop
- Add "Export Trip" menu item (with download/export SVG icon) above the Share button

### 4. Import validation schema — `src/validators/import.ts`

- Zod schema `importTripSchema` validating the full JSON structure:
  - `version`: `z.literal(1)`
  - `trip`: object with `name` (required), `description`, `startDate`, `endDate` (optional strings)
  - `entries`: object with `flights`, `lodgings`, `carRentals`, `restaurants`, `activities` arrays
  - Each entry array validates the same fields as the corresponding create schema but without `type`, `isIdea`, or `attendeeIds`
- This prevents malicious or malformed data from reaching Prisma

### 5. Import API — `src/app/api/trips/import/route.ts`

- `POST /api/trips/import` protected with `withAuth()`
- Parses and validates request body against `importTripSchema`
- Uses `prisma.$transaction()` to atomically:
  1. Create the Trip (name, description, startDate, endDate, ownerId, OWNER membership)
  2. Create all entries across all 5 types with `tripId` and `createdById` set to the importing user
  3. All entries imported as plans (`isIdea: false`)
  4. Date strings converted to Date objects using `convertDates()` from entry-registry
- Returns `{ tripId: string }` (201)

### 6. Import hook — add to `src/hooks/useTrips.ts`

- `useImportTrip()` mutation:
  - `POST /api/trips/import` with the pasted JSON (parsed)
  - `onSuccess`: invalidate `tripKeys.all`
  - Returns `{ tripId }` for navigation

### 7. Import modal — `src/components/dashboard/ImportTripModal.tsx`

- Props: `isOpen`, `onClose`
- Textarea for pasting JSON
- "Import" button triggers validation + API call via `useImportTrip()`
- Client-side JSON.parse with try/catch for immediate feedback on invalid JSON
- Shows validation errors from the API if structure is wrong
- On success: closes modal, navigates to `/trips/{newTripId}`
- Below the textarea: a collapsible "Generate with AI" section (see step 9)

### 8. Wire import into dashboard

**`src/app/dashboard/page.tsx`:**
- Add `const [importOpen, setImportOpen] = useState(false)`
- Add "Import Trip" button next to "+ Create Trip" in the header row
- Render `<ImportTripModal>` alongside `<CreateTripModal>`

### 9. AI prompt template — `src/lib/ai-trip-prompt.ts`

A constant string that users copy, prepend their trip desires to, and paste into Claude/ChatGPT/etc. The LLM generates valid import JSON.

**UX in Import modal:** Below the paste textarea, a collapsible section:
- Header: "Don't have trip data? Generate it with AI"
- When expanded: brief instructions + a read-only textarea showing the prompt template + "Copy Prompt" button
- User workflow: Copy prompt → paste into LLM → type trip desires above it → get JSON → paste JSON back into import textarea

**The prompt template** (stored as `AI_TRIP_PROMPT` constant):

```
=== INSTRUCTIONS (do not remove) ===

Using the trip description above, generate a trip plan as a JSON object. Output ONLY the raw JSON — no markdown fences, no explanation, no commentary.

REQUIRED FORMAT:
{
  "version": 1,
  "trip": {
    "name": "string",
    "description": "string",
    "startDate": "ISO 8601 datetime",
    "endDate": "ISO 8601 datetime"
  },
  "entries": {
    "flights": [],
    "lodgings": [],
    "carRentals": [],
    "restaurants": [],
    "activities": []
  }
}

ENTRY FIELDS (* = required):

Flight:
  airline*, departureCity*, arrivalCity*, departureDate*, arrivalDate*,
  flightNumber, departureAirport, arrivalAirport, notes, cost

Lodging:
  name*, address*, checkIn*, checkOut*,
  lat, lng, notes, cost

Car Rental:
  company*, pickupAddress*, pickupDate*, dropoffDate*,
  dropoffAddress, pickupLat, pickupLng, notes, cost

Restaurant:
  name*, address*, date*,
  time (e.g. "7:30 PM"), lat, lng, cuisine, priceRange, notes, cost

Activity:
  name*, date*,
  address, startTime (e.g. "10:00 AM"), endTime (e.g. "2:00 PM"),
  lat, lng, category, notes, cost

RULES:
- All dates must be ISO 8601 strings (e.g. "2025-06-01T10:00:00.000Z")
- cost is a number (USD, no currency symbol)
- lat/lng are decimal coordinates (e.g. 37.3382, -121.8863)
- Use real place names, real addresses, and accurate coordinates
- Suggest realistic cost estimates
- Space activities and meals across the full trip dates
- Match the traveler's stated preferences
- Include all 5 entry arrays even if empty
- Keep notes brief and useful (e.g. "Reservation recommended")
- Do not include any fields not listed above
```

**Usage example** (what the user pastes into an LLM):
```
I want to go on a trip to San Jose from May 1 to May 5. I'd like to visit fun
attractions during the day and eat at upscale dining in the evening. I like to
stay in AirBnBs near the beach.

=== INSTRUCTIONS (do not remove) ===

Using the trip description above, generate a trip plan as a JSON object...
[rest of prompt]
```

## Files Modified

| File | Change |
|------|--------|
| `src/lib/trip-export.ts` | **NEW** — serialization utility |
| `src/validators/import.ts` | **NEW** — Zod schema for import validation |
| `src/app/api/trips/import/route.ts` | **NEW** — import API endpoint |
| `src/lib/ai-trip-prompt.ts` | **NEW** — AI prompt template constant |
| `src/components/trip/ExportTripModal.tsx` | **NEW** — export modal |
| `src/components/dashboard/ImportTripModal.tsx` | **NEW** — import modal (includes AI prompt section) |
| `src/components/trip/TripHeader.tsx` | Add export state + button + modal |
| `src/components/trip/TripHeaderMenu.tsx` | Add "Export Trip" menu item + `onExport` prop |
| `src/app/dashboard/page.tsx` | Add import state + button + modal |
| `src/hooks/useTrips.ts` | Add `useImportTrip()` hook |

## Existing code to reuse

- `Modal` base component (`src/components/ui/Modal.tsx`) — for both modals
- `useEntries(tripId)` hook — to get cached planner entries for export
- `withAuth()` HOF (`src/lib/auth-helpers.ts`) — for import API auth
- `entryRegistry` + `convertDates()` (`src/lib/entry-registry.ts`) — for date conversion on import
- `Button` component (`src/components/ui/Button.tsx`) — for all buttons
- `tripKeys` (`src/hooks/useTrips.ts`) — for cache invalidation on import

## Verification

1. **Export flow:** Open a trip with entries → click Export → verify JSON in textarea contains all entry fields (minus internal ones) → click Copy → paste elsewhere to confirm clipboard works
2. **Import flow:** Copy the exported JSON → go to Dashboard → click Import Trip → paste → click Import → verify new trip appears with all entries intact
3. **Round-trip test:** Export trip A → Import → verify new trip B has identical entries (field-by-field comparison)
4. **Error handling:** Try importing invalid JSON, empty JSON, missing required fields — verify friendly error messages
5. **Auth:** Verify import endpoint returns 401 when not logged in
6. **AI prompt flow:** Copy prompt from Import modal → paste into Claude → prepend trip description → verify generated JSON imports successfully
7. **Run existing tests:** `npm run test` to ensure nothing is broken
