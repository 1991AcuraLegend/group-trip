import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { MemberRole } from '@prisma/client';
import { tripKeys } from './useTrips';

export const memberKeys = {
  all: (tripId: string) => ['trips', tripId, 'members'] as const,
  share: (tripId: string) => ['trips', tripId, 'share'] as const,
};

export type MemberWithUser = {
  id: string;
  userId: string;
  tripId: string;
  role: MemberRole;
  joinedAt: string;
  user: { id: string; name: string; email: string };
};

export type ShareInfo = {
  // Owner's configurable link (null when the current user is not the owner)
  shareCode: string | null;
  shareUrl: string | null;
  shareRole: MemberRole | null;
  // View-only link shown to non-owners (null when the current user is the owner)
  viewerShareCode: string | null;
  viewerShareUrl: string | null;
  memberCount: number;
};

export function useMembers(tripId: string) {
  return useQuery<MemberWithUser[]>({
    queryKey: memberKeys.all(tripId),
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/members`);
      if (!res.ok) throw new Error('Failed to fetch members');
      return res.json();
    },
    enabled: !!tripId,
  });
}

export function useRemoveMember(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      const res = await fetch(`/api/trips/${tripId}/members/${memberId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove member');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: memberKeys.all(tripId) }),
  });
}

export function useLeaveTrip(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      const res = await fetch(`/api/trips/${tripId}/members/${memberId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to leave trip');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all(tripId) });
      queryClient.invalidateQueries({ queryKey: tripKeys.all });
    },
  });
}

export function useUpdateMemberRole(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: MemberRole }) => {
      const res = await fetch(`/api/trips/${tripId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error('Failed to update role');
      return res.json() as Promise<MemberWithUser>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: memberKeys.all(tripId) }),
  });
}

export function useShareInfo(tripId: string) {
  return useQuery<ShareInfo>({
    queryKey: memberKeys.share(tripId),
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/share`);
      if (!res.ok) throw new Error('Failed to fetch share info');
      return res.json();
    },
    enabled: !!tripId,
  });
}

export function useGenerateShareLink(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (role: MemberRole = 'COLLABORATOR') => {
      const res = await fetch(`/api/trips/${tripId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error('Failed to generate share link');
      return res.json() as Promise<{ shareCode: string; shareUrl: string; shareRole: MemberRole }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.share(tripId) });
    },
  });
}

export function useJoinTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const res = await fetch(`/api/join/${code}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join trip');
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tripKeys.all }),
  });
}
