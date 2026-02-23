import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    tripMember: {
      findUnique: vi.fn(),
    },
  },
}));

import { getTripMembership, isTripOwner } from '@/lib/trip-auth';
import { prisma } from '@/lib/prisma';
import { makeTripMember } from '../fixtures';
import { MemberRole } from '@prisma/client';

const mockFindUnique = vi.mocked(prisma.tripMember.findUnique);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getTripMembership', () => {
  it('returns the member record when found', async () => {
    const member = makeTripMember({ userId: 'user-1', tripId: 'trip-1', role: MemberRole.OWNER });
    mockFindUnique.mockResolvedValueOnce(member);

    const result = await getTripMembership('trip-1', 'user-1');
    expect(result).toEqual(member);
  });

  it('returns null when member is not found', async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const result = await getTripMembership('trip-1', 'user-99');
    expect(result).toBeNull();
  });

  it('queries with the correct compound key', async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    await getTripMembership('trip-42', 'user-7');
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { userId_tripId: { userId: 'user-7', tripId: 'trip-42' } },
    });
  });
});

describe('isTripOwner', () => {
  it('returns true when the member role is OWNER', async () => {
    const member = makeTripMember({ role: MemberRole.OWNER });
    mockFindUnique.mockResolvedValueOnce(member);

    expect(await isTripOwner('trip-1', 'user-1')).toBe(true);
  });

  it('returns false when the member role is COLLABORATOR', async () => {
    const member = makeTripMember({ role: MemberRole.COLLABORATOR });
    mockFindUnique.mockResolvedValueOnce(member);

    expect(await isTripOwner('trip-1', 'user-1')).toBe(false);
  });

  it('returns false when the member role is VIEWER', async () => {
    const member = makeTripMember({ role: MemberRole.VIEWER });
    mockFindUnique.mockResolvedValueOnce(member);

    expect(await isTripOwner('trip-1', 'user-1')).toBe(false);
  });

  it('returns false when the user is not a member (null)', async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    expect(await isTripOwner('trip-1', 'user-99')).toBe(false);
  });
});
