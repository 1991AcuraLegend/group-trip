import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Flight, Lodging, CarRental, Restaurant, Activity } from '@prisma/client';
import type { EntryType } from '@/types';
import type { CreateEntryInput } from '@/validators/entry';

export const entryKeys = {
  all: (tripId: string) => ['trips', tripId, 'entries'] as const,
  detail: (tripId: string, entryId: string) => ['trips', tripId, 'entries', entryId] as const,
};

export type EntriesData = {
  flights: Flight[];
  lodgings: Lodging[];
  carRentals: CarRental[];
  restaurants: Restaurant[];
  activities: Activity[];
};

export function useEntries(tripId: string) {
  return useQuery<EntriesData>({
    queryKey: entryKeys.all(tripId),
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/entries`);
      if (!res.ok) throw new Error('Failed to fetch entries');
      return res.json();
    },
    enabled: !!tripId,
  });
}

export function useCreateEntry(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateEntryInput) => {
      const res = await fetch(`/api/trips/${tripId}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create entry');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: entryKeys.all(tripId) }),
  });
}

export function useUpdateEntry(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      entryId,
      type,
      data,
    }: {
      entryId: string;
      type: EntryType;
      data: Record<string, unknown>;
    }) => {
      const res = await fetch(`/api/trips/${tripId}/entries/${entryId}?type=${type}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update entry');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: entryKeys.all(tripId) }),
  });
}

export function useDeleteEntry(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ entryId, type }: { entryId: string; type: EntryType }) => {
      const res = await fetch(`/api/trips/${tripId}/entries/${entryId}?type=${type}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete entry');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: entryKeys.all(tripId) }),
  });
}
