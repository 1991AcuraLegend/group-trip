import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TripWithMemberCount, TripWithEntries } from '@/types';
import type { CreateTripInput, UpdateTripInput } from '@/validators/trip';

export const tripKeys = {
  all: ['trips'] as const,
  detail: (id: string) => ['trips', id] as const,
};

export function useTrips() {
  return useQuery<TripWithMemberCount[]>({
    queryKey: tripKeys.all,
    queryFn: async () => {
      const res = await fetch('/api/trips');
      if (!res.ok) throw new Error('Failed to fetch trips');
      return res.json();
    },
  });
}

export function useTrip(tripId: string) {
  return useQuery<TripWithEntries>({
    queryKey: tripKeys.detail(tripId),
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}`);
      if (!res.ok) throw new Error('Failed to fetch trip');
      return res.json();
    },
    enabled: !!tripId,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTripInput) => {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create trip');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tripKeys.all }),
  });
}

export function useUpdateTrip(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateTripInput) => {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update trip');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripKeys.all });
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
    },
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tripId: string) => {
      const res = await fetch(`/api/trips/${tripId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete trip');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tripKeys.all }),
  });
}

export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      return res.json() as Promise<{ url: string }>;
    },
  });
}
