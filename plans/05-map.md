# WS 5 — Map

> **Depends on:** WS 0 (Bootstrap)
> **Can parallelize with:** WS 1–4, 6
> **Merge order:** 6th (after WS 4)

---

## Overview

Implement the interactive map using Leaflet + OpenStreetMap on the trip detail page. Includes color-coded pins for each entry type, auto-zoom to fit all pins, pin click popups, and an address autocomplete component using Nominatim geocoding. All map components use dynamic imports (no SSR) since Leaflet requires `window`.

---

## Files to Create

### 1. Geocoding Library

#### `src/lib/geocoding.ts`

```ts
import type { GeocodingResult } from '@/types';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

// Search for addresses (for autocomplete)
export async function searchAddress(query: string): Promise<GeocodingResult[]> {
  if (query.length < 3) return [];

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '5',
    addressdetails: '1',
  });

  const res = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
    headers: { 'User-Agent': 'TravelPlanner/1.0' }, // Required by Nominatim ToS
  });

  if (!res.ok) return [];

  const data = await res.json();
  return data.map((item: any) => ({
    displayName: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }));
}

// Reverse geocode (lat/lng → address) — for map click
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lng.toString(),
    format: 'json',
  });

  const res = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
    headers: { 'User-Agent': 'TravelPlanner/1.0' },
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.display_name || null;
}
```

**Important:** Nominatim usage policy requires max 1 request/second. The useGeocoding hook debounces at 500ms.

---

### 2. Geocoding Hook

#### `src/hooks/useGeocoding.ts`

```ts
import { useState, useEffect, useRef } from 'react';
import { searchAddress } from '@/lib/geocoding';
import type { GeocodingResult } from '@/types';

export function useGeocoding(query: string) {
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const data = await searchAddress(query);
      setResults(data);
      setIsLoading(false);
    }, 500); // 500ms debounce to respect Nominatim rate limits

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return { results, isLoading };
}
```

---

### 3. Address Autocomplete Component

#### `src/components/map/AddressAutocomplete.tsx`

```tsx
'use client';

Props:
  label (string)
  value (string)           // the address text
  onChange (string => void) // update address text
  onSelect (result: GeocodingResult => void)  // when user picks a result (sets lat/lng)
  error? (string)

Implementation:
1. Text input that shows address value
2. As user types, useGeocoding(value) returns suggestions
3. Dropdown below input shows suggestion list
4. When user clicks a suggestion:
   - Set the address text to displayName
   - Call onSelect({ displayName, lat, lng })
5. Close dropdown on blur (with small delay for click to register)
6. Show loading spinner while searching
7. Keyboard navigation: arrow keys + enter to select

Integration with React Hook Form:
- In entry forms, use Controller:
  <Controller
    name="address"
    control={control}
    render={({ field }) => (
      <AddressAutocomplete
        label="Address"
        value={field.value}
        onChange={field.onChange}
        onSelect={(result) => {
          field.onChange(result.displayName);
          setValue('lat', result.lat);
          setValue('lng', result.lng);
        }}
      />
    )}
  />
```

---

### 4. Map Component

#### `src/components/map/TripMap.tsx`

**CRITICAL:** Must use dynamic import to avoid SSR issues with Leaflet.

```tsx
// This file is the wrapper that handles dynamic import
'use client';
import dynamic from 'next/dynamic';
import type { MappableEntry } from '@/types';

const MapContent = dynamic(() => import('./MapContent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  ),
});

type TripMapProps = {
  entries: MappableEntry[];
  onPinClick?: (entry: MappableEntry) => void;
};

export default function TripMap({ entries, onPinClick }: TripMapProps) {
  return <MapContent entries={entries} onPinClick={onPinClick} />;
}
```

#### `src/components/map/MapContent.tsx`

The actual Leaflet map (only loaded client-side):

```tsx
'use client';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import type { MappableEntry } from '@/types';
import { ENTRY_COLORS } from '@/lib/constants';

// Fix Leaflet default icon issue in webpack
// (delete default icon URLs and set them manually)

type Props = {
  entries: MappableEntry[];
  onPinClick?: (entry: MappableEntry) => void;
};

// Custom colored markers using SVG
function createColoredIcon(color: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'custom-marker',
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  });
}

// Auto-zoom component
function AutoZoom({ entries }: { entries: MappableEntry[] }) {
  const map = useMap();

  useEffect(() => {
    if (entries.length === 0) {
      map.setView([20, 0], 2); // World view when no entries
      return;
    }

    if (entries.length === 1) {
      map.setView([entries[0].lat, entries[0].lng], 14);
      return;
    }

    const bounds = L.latLngBounds(entries.map(e => [e.lat, e.lng]));
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [entries, map]);

  return null;
}

export default function MapContent({ entries, onPinClick }: Props) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      className="w-full h-full"
      style={{ minHeight: '300px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <AutoZoom entries={entries} />
      {entries.map((entry) => (
        <Marker
          key={entry.id}
          position={[entry.lat, entry.lng]}
          icon={createColoredIcon(ENTRY_COLORS[entry.type])}
          eventHandlers={{
            click: () => onPinClick?.(entry),
          }}
        >
          <Popup>
            <div>
              <strong>{entry.name}</strong>
              <br />
              <span className="text-sm text-gray-500">{entry.address}</span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
```

---

### 5. Map Pin Component

#### `src/components/map/MapPin.tsx`

```tsx
// SVG pin icons for use outside the map (e.g., in entry cards as type indicators)
import { ENTRY_COLORS } from '@/lib/constants';
import type { EntryType } from '@/types';

type Props = { type: Exclude<EntryType, 'flight'>; size?: number };

export function MapPin({ type, size = 16 }: Props) {
  const color = ENTRY_COLORS[type];
  return (
    <svg width={size} height={size} viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill={color}/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>
  );
}
```

---

### 6. Leaflet CSS Fix

#### `src/app/globals.css` (append)

```css
/* Leaflet custom marker reset */
.custom-marker {
  background: none !important;
  border: none !important;
}
```

---

### 7. Integration with Trip Detail Page

After WS 4 and WS 5 merge, update `src/app/trips/[tripId]/page.tsx` to:

```tsx
// Replace map placeholder with:
import TripMap from '@/components/map/TripMap';
import { entriesToMappable } from '@/lib/entry-helpers';

// In the component:
const entries = useEntries(tripId);
const mappableEntries = entries.data ? entriesToMappable(entries.data) : [];

<TripMap
  entries={mappableEntries}
  onPinClick={(entry) => {
    // Scroll to the entry in the panel, or highlight it
    // Implementation: set a selectedEntryId state, pass to EntryPanel
  }}
/>
```

Also update entry forms to use `<AddressAutocomplete>` instead of plain `<Input>` for address fields.

---

## Interface Contracts

### What this workstream exports:

| Export | Path | Used by |
|--------|------|---------|
| `<TripMap>` | `src/components/map/TripMap.tsx` | Trip detail page |
| `<AddressAutocomplete>` | `src/components/map/AddressAutocomplete.tsx` | WS 4 entry forms |
| `<MapPin>` | `src/components/map/MapPin.tsx` | WS 4 entry cards |
| `searchAddress()` | `src/lib/geocoding.ts` | AddressAutocomplete |
| `useGeocoding()` | `src/hooks/useGeocoding.ts` | AddressAutocomplete |

### What this workstream consumes:

| Dependency | From | Notes |
|-----------|------|-------|
| `MappableEntry` type | WS 0 | Pin data shape |
| `ENTRY_COLORS` | WS 0 | Pin colors |
| `entriesToMappable()` | WS 3 | Convert raw entries to pins |
| `useEntries()` | WS 3 | Get entry data for the map |
| `<LoadingSpinner>` | WS 1 | Loading state |

---

## Stubbing for Parallel Work

Until WS 3 merges:
- Use mock entry data to render pins:
```ts
const mockPins: MappableEntry[] = [
  { id: '1', type: 'lodging', name: 'Test Hotel', lat: 48.8566, lng: 2.3522, address: 'Paris, France' },
  { id: '2', type: 'restaurant', name: 'Test Restaurant', lat: 48.8606, lng: 2.3376, address: 'Near Louvre' },
];
```

Until WS 4 merges (trip detail page):
- Create a standalone test page at `/test-map` to develop the map component in isolation

---

## Verification Checklist

- [ ] Map renders without SSR errors (dynamic import works)
- [ ] OpenStreetMap tiles load correctly
- [ ] Pins render at correct lat/lng positions
- [ ] Pin colors match entry types (blue=lodging, orange=carRental, red=restaurant, green=activity)
- [ ] Clicking a pin shows popup with name and address
- [ ] Auto-zoom fits all pins with padding
- [ ] Single pin: zooms to level 14 centered on pin
- [ ] No pins: shows world view (zoom level 2)
- [ ] Address autocomplete shows suggestions after 3+ characters
- [ ] Selecting a suggestion populates address + lat/lng
- [ ] Debounce prevents excessive Nominatim requests (check network tab)
- [ ] Map resizes correctly on window resize
- [ ] Mobile: map renders at fixed height (300px)
- [ ] No console errors about Leaflet icons
