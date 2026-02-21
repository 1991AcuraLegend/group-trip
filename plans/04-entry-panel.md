# WS 4 — Entry Panel & Trip Detail Page

> **Depends on:** WS 0 (Bootstrap)
> **Can parallelize with:** WS 1–3, 5–6
> **Merge order:** 5th (after WS 3)

---

## Overview

Build the trip detail page layout with the entry panel — the right side of the split view showing tabbed entry lists and forms for creating/editing flights, lodging, car rentals, restaurants, and activities. The left side (map) is handled by WS 5.

---

## Files to Create

### 1. Trip Detail Page

#### `src/app/trips/[tripId]/page.tsx`

```tsx
Server component that:
1. Reads tripId from params
2. Renders the trip detail layout (client component)

Structure:
- TripHeader (name, dates, share button, back link)
- Split view container:
  - Left: <TripMap /> (WS 5 — render placeholder div until WS 5 merges)
  - Right: <EntryPanel />
- Responsive: on mobile, stack vertically (map on top, entries below)
```

Layout CSS:
```
Desktop (lg+): grid grid-cols-[1fr_400px] h-[calc(100vh-64px)]
  - Left: map fills remaining space
  - Right: 400px fixed-width scrollable panel
Mobile: flex flex-col
  - Map: h-[300px]
  - Panel: flex-1
```

---

### 2. Trip Header

#### `src/components/trip/TripHeader.tsx`

```tsx
Props: trip (Trip), memberCount (number)
- Back link: ← Dashboard (link to /dashboard)
- Trip name (h1, editable inline on click — stretch goal, basic text for MVP)
- Date range display
- Member count badge
- "Share" button (opens ShareModal from WS 6 — render disabled placeholder until then)
- "Delete Trip" button (danger, owner only — confirm dialog)
```

---

### 3. Entry Panel

#### `src/components/trip/EntryPanel.tsx`

```tsx
Props: tripId (string)

The main panel component:
1. Uses useEntries(tripId) hook to fetch all entries
2. Tabs component at top: Flights | Lodging | Car Rentals | Restaurants | Activities
   - Each tab shows count badge: "Flights (3)"
3. "Add Entry" button → opens the form for the current tab's entry type
4. Below tabs: <EntryList /> filtered by active tab
5. States: loading skeleton, empty state per tab ("No flights added yet"), error state
```

#### `src/components/trip/EntryList.tsx`

```tsx
Props: entries (array of a single type), type (EntryType), tripId (string)

- Maps entries to <EntryCard /> components
- Sorted by date (using getEntryDate helper)
- Empty state message if no entries
```

#### `src/components/trip/EntryCard.tsx`

```tsx
Props: entry (any entry type), type (EntryType), tripId (string)

Renders a card with type-specific layout:

**Flight card:**
- Airline + flight number
- Departure → Arrival (cities, airports)
- Date/time
- Confirmation number
- Cost

**Lodging card:**
- Hotel/lodging name
- Address
- Check-in → Check-out dates
- Confirmation number
- Cost

**Car Rental card:**
- Company name
- Pickup address → Dropoff address
- Pickup → Dropoff dates
- Confirmation number
- Cost

**Restaurant card:**
- Restaurant name
- Address
- Date + time
- Cuisine type + price range
- Reservation ID
- Cost

**Activity card:**
- Activity name
- Address
- Date + time range
- Category
- Booking reference
- Cost

All cards have:
- Color-coded left border (using ENTRY_COLORS from constants)
- Edit button (pencil icon) → opens edit form
- Delete button (trash icon) → confirm dialog, then useDeleteEntry()
- Notes section (collapsible if long)
```

---

### 4. Entry Forms

All forms use React Hook Form with the corresponding Zod schema from `src/validators/entry.ts`.

#### `src/components/trip/forms/FlightForm.tsx`
```tsx
Props: tripId, onClose, existingFlight? (for edit mode)

Fields:
- airline (text, required)
- flightNumber (text)
- departureCity (text, required)
- arrivalCity (text, required)
- departureAirport (text)
- arrivalAirport (text)
- departureDate (datetime-local, required)
- arrivalDate (datetime-local, required)
- confirmationNum (text)
- cost (number)
- notes (textarea)

Submit:
- Create mode: useCreateEntry with type: 'flight'
- Edit mode: useUpdateEntry
- On success: close form, entries refetch via invalidation
```

#### `src/components/trip/forms/LodgingForm.tsx`
```tsx
Fields:
- name (text, required)
- address (text, required) — with AddressAutocomplete (WS 5, stub as plain input until then)
- checkIn (datetime-local, required)
- checkOut (datetime-local, required)
- lat/lng (hidden, populated by geocoding)
- confirmationNum (text)
- cost (number)
- notes (textarea)
```

#### `src/components/trip/forms/CarRentalForm.tsx`
```tsx
Fields:
- company (text, required)
- pickupAddress (text, required) — with AddressAutocomplete
- dropoffAddress (text) — with AddressAutocomplete
- pickupDate (datetime-local, required)
- dropoffDate (datetime-local, required)
- pickupLat/pickupLng (hidden, populated by geocoding)
- confirmationNum (text)
- cost (number)
- notes (textarea)
```

#### `src/components/trip/forms/RestaurantForm.tsx`
```tsx
Fields:
- name (text, required)
- address (text, required) — with AddressAutocomplete
- date (date, required)
- time (time)
- lat/lng (hidden)
- cuisine (text)
- priceRange (select: $, $$, $$$, $$$$)
- reservationId (text)
- cost (number)
- notes (textarea)
```

#### `src/components/trip/forms/ActivityForm.tsx`
```tsx
Fields:
- name (text, required)
- address (text) — with AddressAutocomplete
- date (date, required)
- startTime (time)
- endTime (time)
- lat/lng (hidden)
- category (text)
- bookingRef (text)
- cost (number)
- notes (textarea)
```

---

### 5. UI Components (new)

#### `src/components/ui/Tabs.tsx`
```tsx
Props: tabs ({ label: string, count?: number, value: string }[]), activeTab (string), onChange

- Horizontal tab bar with underline indicator
- Badge showing count next to label
- Tailwind: border-b, active tab has border-blue-500 text-blue-600
```

---

### 6. Form Rendering Pattern

Each form is rendered inside a modal (from WS 2's `<Modal>`):

```tsx
// In EntryPanel.tsx
const [formOpen, setFormOpen] = useState<EntryType | null>(null);
const [editingEntry, setEditingEntry] = useState<{ type: EntryType; data: any } | null>(null);

// Add button opens create form
<Button onClick={() => setFormOpen(activeTab)}>Add {ENTRY_LABELS[activeTab]}</Button>

// Edit button on card opens edit form
<EntryCard onEdit={(entry) => setEditingEntry({ type: activeTab, data: entry })} />

// Render form in modal
<Modal isOpen={!!formOpen || !!editingEntry} onClose={closeForm} title={...}>
  {renderForm()} {/* switches on type to render correct form */}
</Modal>
```

---

## Interface Contracts

### What this workstream exports:

| Export | Path | Used by |
|--------|------|---------|
| Trip detail page | `src/app/trips/[tripId]/page.tsx` | Router (navigation from dashboard) |
| `<EntryPanel>` | `src/components/trip/EntryPanel.tsx` | Trip detail page |
| `<EntryCard>` | `src/components/trip/EntryCard.tsx` | Entry panel |
| `<Tabs>` | `src/components/ui/Tabs.tsx` | Shared UI |
| Entry forms (5) | `src/components/trip/forms/` | Entry panel |
| `<TripHeader>` | `src/components/trip/TripHeader.tsx` | Trip detail page |

### What this workstream consumes:

| Dependency | From | Notes |
|-----------|------|-------|
| `useEntries()`, `useCreateEntry()`, etc. | WS 3 | Entry data + mutations (stub with mock data until merge) |
| `useTrip()` | WS 2 | Trip data for header (stub until merge) |
| `getEntryDate()`, `getEntryName()` | WS 3 | Display helpers (stub until merge) |
| `createEntrySchema` validators | WS 0 | Form validation |
| `ENTRY_COLORS`, `ENTRY_LABELS` | WS 0 | Display constants |
| `<Button>`, `<Input>`, `<LoadingSpinner>` | WS 1 | UI primitives |
| `<Modal>`, `<Card>` | WS 2 | UI containers |
| `<AddressAutocomplete>` | WS 5 | Geocoding input (stub as plain `<Input>` until merge) |

---

## Stubbing for Parallel Work

### Map placeholder (until WS 5 merges):
```tsx
// In trip detail page, where <TripMap /> will go:
<div className="bg-gray-100 flex items-center justify-center text-gray-400">
  <p>Map loading...</p>
</div>
```

### AddressAutocomplete placeholder (until WS 5 merges):
```tsx
// Use a plain <Input> with a text field
// After WS 5 merges, replace with <AddressAutocomplete> which sets lat/lng
<Input label="Address" {...register('address')} />
```

### Entry hooks placeholder (until WS 3 merges):
```tsx
// Mock useEntries to return empty arrays
export function useEntries(tripId: string) {
  return { data: { flights: [], lodgings: [], carRentals: [], restaurants: [], activities: [] }, isLoading: false };
}
```

### Share button placeholder (until WS 6 merges):
```tsx
<Button variant="secondary" disabled>Share (coming soon)</Button>
```

---

## Verification Checklist

- [ ] Trip detail page loads with correct trip data
- [ ] Tabs switch between entry types
- [ ] Tab badges show correct counts
- [ ] Entry cards display type-specific information
- [ ] Entry cards have color-coded left borders
- [ ] "Add" button opens the correct form for the active tab
- [ ] Flight form creates a flight entry
- [ ] Lodging form creates a lodging entry (repeat for all types)
- [ ] Edit form pre-fills existing data
- [ ] Delete button removes entry after confirmation
- [ ] Form validation shows errors for required fields
- [ ] Cost field accepts numeric input
- [ ] Notes field is optional and renders correctly
- [ ] Responsive layout: panel below map on mobile
- [ ] Back link navigates to dashboard
- [ ] Loading and empty states display correctly
