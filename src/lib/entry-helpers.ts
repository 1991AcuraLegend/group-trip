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

  entries.lodgings.forEach((l) => {
    if (l.lat && l.lng) {
      pins.push({ id: l.id, type: 'lodging', name: l.name, lat: l.lat, lng: l.lng, address: l.address });
    }
  });
  entries.carRentals.forEach((c) => {
    if (c.pickupLat && c.pickupLng) {
      pins.push({ id: c.id, type: 'carRental', name: c.company, lat: c.pickupLat, lng: c.pickupLng, address: c.pickupAddress });
    }
  });
  entries.restaurants.forEach((r) => {
    if (r.lat && r.lng) {
      pins.push({ id: r.id, type: 'restaurant', name: r.name, lat: r.lat, lng: r.lng, address: r.address });
    }
  });
  entries.activities.forEach((a) => {
    if (a.lat && a.lng) {
      pins.push({ id: a.id, type: 'activity', name: a.name, lat: a.lat, lng: a.lng, address: a.address || '' });
    }
  });

  return pins;
}

// Get the primary date for any entry (for sorting/display)
export function getEntryDate(type: EntryType, entry: Flight | Lodging | CarRental | Restaurant | Activity): Date {
  switch (type) {
    case 'flight': return new Date((entry as Flight).departureDate);
    case 'lodging': return new Date((entry as Lodging).checkIn);
    case 'carRental': return new Date((entry as CarRental).pickupDate);
    case 'restaurant': return new Date((entry as Restaurant).date);
    case 'activity': return new Date((entry as Activity).date);
  }
}

// Get display name for an entry
export function getEntryName(type: EntryType, entry: Flight | Lodging | CarRental | Restaurant | Activity): string {
  switch (type) {
    case 'flight': {
      const f = entry as Flight;
      return `${f.airline}${f.flightNumber ? ` ${f.flightNumber}` : ''}`;
    }
    case 'lodging': return (entry as Lodging).name;
    case 'carRental': return (entry as CarRental).company;
    case 'restaurant': return (entry as Restaurant).name;
    case 'activity': return (entry as Activity).name;
  }
}
