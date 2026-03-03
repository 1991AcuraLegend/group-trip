import type { Trip } from '@prisma/client';
import type { EntriesData } from '@/hooks/useEntries';

const INTERNAL_FIELDS = new Set([
  'id',
  'tripId',
  'createdById',
  'attendeeIds',
  'isIdea',
  'createdAt',
  'updatedAt',
]);

function stripInternalFields(entry: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entry)) {
    if (!INTERNAL_FIELDS.has(key)) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export type ExportData = {
  version: 1;
  trip: {
    name: string;
    description: string | null;
    startDate: string | null;
    endDate: string | null;
  };
  entries: {
    flights: Record<string, unknown>[];
    lodgings: Record<string, unknown>[];
    carRentals: Record<string, unknown>[];
    restaurants: Record<string, unknown>[];
    activities: Record<string, unknown>[];
  };
};

export function serializeTripForExport(trip: Trip, entries: EntriesData): string {
  const data: ExportData = {
    version: 1,
    trip: {
      name: trip.name,
      description: trip.description ?? null,
      startDate: trip.startDate ? new Date(trip.startDate).toISOString() : null,
      endDate: trip.endDate ? new Date(trip.endDate).toISOString() : null,
    },
    entries: {
      flights: entries.flights.map((e) => stripInternalFields(e as unknown as Record<string, unknown>)),
      lodgings: entries.lodgings.map((e) => stripInternalFields(e as unknown as Record<string, unknown>)),
      carRentals: entries.carRentals.map((e) => stripInternalFields(e as unknown as Record<string, unknown>)),
      restaurants: entries.restaurants.map((e) => stripInternalFields(e as unknown as Record<string, unknown>)),
      activities: entries.activities.map((e) => stripInternalFields(e as unknown as Record<string, unknown>)),
    },
  };

  return JSON.stringify(data, null, 2);
}
