import type { GeocodingResult } from '@/types';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

// Search for addresses (for autocomplete). Requires query >= 3 chars.
export async function searchAddress(query: string): Promise<GeocodingResult[]> {
  if (query.length < 3) return [];

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '5',
    addressdetails: '1',
    namedetails: '1',
  });

  try {
    const res = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
      headers: { 'User-Agent': 'TravelPlanner/1.0' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((item: { display_name: string; lat: string; lon: string; namedetails?: { name?: string } }) => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      name: item.namedetails?.name,
    }));
  } catch {
    return [];
  }
}

// Reverse geocode: lat/lng → display address
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lng.toString(),
    format: 'json',
  });

  try {
    const res = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
      headers: { 'User-Agent': 'TravelPlanner/1.0' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.display_name || null;
  } catch {
    return null;
  }
}
