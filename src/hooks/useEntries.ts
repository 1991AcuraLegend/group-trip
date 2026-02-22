import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Flight, Lodging, CarRental, Restaurant, Activity } from '@prisma/client';
import type { EntryType } from '@/types';
import type { CreateEntryInput, CreateIdeaEntryInput } from '@/validators/entry';

export const entryKeys = {
  all: (tripId: string) => ['trips', tripId, 'entries'] as const,
  ideas: (tripId: string) => ['trips', tripId, 'ideas'] as const,
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

export function useIdeas(tripId: string) {
  return useQuery<EntriesData>({
    queryKey: entryKeys.ideas(tripId),
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/entries?ideas=true`);
      if (!res.ok) throw new Error('Failed to fetch ideas');
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

export function useCreateIdea(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateIdeaEntryInput) => {
      const res = await fetch(`/api/trips/${tripId}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create idea');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: entryKeys.ideas(tripId) }),
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

/** Promotes an idea to a plan entry (sets isIdea: false) and invalidates both caches. */
export function usePromoteToPlan(tripId: string) {
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
        body: JSON.stringify({ ...data, isIdea: false }),
      });
      if (!res.ok) throw new Error('Failed to promote idea to plan');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entryKeys.all(tripId) });
      queryClient.invalidateQueries({ queryKey: entryKeys.ideas(tripId) });
    },
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
export function useDeleteIdea(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ entryId, type }: { entryId: string; type: EntryType }) => {
      const res = await fetch(`/api/trips/${tripId}/entries/${entryId}?type=${type}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete idea');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: entryKeys.ideas(tripId) }),
  });
}