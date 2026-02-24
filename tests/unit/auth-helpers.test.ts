import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/lib/trip-auth', () => ({
  getTripMembership: vi.fn(),
}));

// Mock NextResponse so we can inspect status codes without a real Next.js runtime
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn().mockImplementation((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      body,
    })),
  },
}));

import { getServerSession } from 'next-auth';
import { getSession, requireAuth, withAuth, withTripAuth } from '@/lib/auth-helpers';
import { getTripMembership } from '@/lib/trip-auth';
import { makeTripMember, makeSession } from '../fixtures';
import { MemberRole } from '@prisma/client';

const mockGetServerSession = vi.mocked(getServerSession);
const mockGetTripMembership = vi.mocked(getTripMembership);

const SESSION = makeSession();

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// getSession
// ---------------------------------------------------------------------------

describe('getSession', () => {
  it('returns the session when one exists', async () => {
    mockGetServerSession.mockResolvedValueOnce(SESSION as any);
    const result = await getSession();
    expect(result).toEqual(SESSION);
  });

  it('returns null when there is no session', async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    const result = await getSession();
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// requireAuth
// ---------------------------------------------------------------------------

describe('requireAuth', () => {
  it('returns the session when authenticated', async () => {
    mockGetServerSession.mockResolvedValueOnce(SESSION as any);
    const result = await requireAuth();
    expect(result).toEqual(SESSION);
  });

  it('throws "Unauthorized" when there is no session', async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    await expect(requireAuth()).rejects.toThrow('Unauthorized');
  });

  it('throws "Unauthorized" when session exists but has no user.id', async () => {
    mockGetServerSession.mockResolvedValueOnce({ user: {} } as any);
    await expect(requireAuth()).rejects.toThrow('Unauthorized');
  });
});

// ---------------------------------------------------------------------------
// withAuth
// ---------------------------------------------------------------------------

describe('withAuth', () => {
  it('returns a 401 response when there is no session', async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    const handler = vi.fn();
    const response = await withAuth(handler);
    expect((response as any).status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it('calls the handler with the session when authenticated', async () => {
    mockGetServerSession.mockResolvedValueOnce(SESSION as any);
    const handlerResult = { status: 200, body: { ok: true } };
    const handler = vi.fn().mockResolvedValue(handlerResult);

    const response = await withAuth(handler);
    expect(handler).toHaveBeenCalledWith(SESSION);
    expect(response).toBe(handlerResult);
  });
});

// ---------------------------------------------------------------------------
// withTripAuth
// ---------------------------------------------------------------------------

describe('withTripAuth', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    const response = await withTripAuth('trip-1', MemberRole.VIEWER, vi.fn());
    expect((response as any).status).toBe(401);
  });

  it('returns 403 when the user is not a trip member', async () => {
    mockGetServerSession.mockResolvedValueOnce(SESSION as any);
    mockGetTripMembership.mockResolvedValueOnce(null);
    const response = await withTripAuth('trip-1', MemberRole.VIEWER, vi.fn());
    expect((response as any).status).toBe(403);
  });

  it('calls the handler when OWNER requires OWNER role', async () => {
    const member = makeTripMember({ role: MemberRole.OWNER });
    mockGetServerSession.mockResolvedValueOnce(SESSION as any);
    mockGetTripMembership.mockResolvedValueOnce(member as any);
    const handlerResult = { status: 200 };
    const handler = vi.fn().mockResolvedValue(handlerResult);

    const response = await withTripAuth('trip-1', MemberRole.OWNER, handler);
    expect(handler).toHaveBeenCalled();
    expect(response).toBe(handlerResult);
  });

  it('calls the handler when OWNER satisfies COLLABORATOR requirement', async () => {
    const member = makeTripMember({ role: MemberRole.OWNER });
    mockGetServerSession.mockResolvedValueOnce(SESSION as any);
    mockGetTripMembership.mockResolvedValueOnce(member as any);
    const handler = vi.fn().mockResolvedValue({ status: 200 });

    await withTripAuth('trip-1', MemberRole.COLLABORATOR, handler);
    expect(handler).toHaveBeenCalled();
  });

  it('calls the handler when OWNER satisfies VIEWER requirement', async () => {
    const member = makeTripMember({ role: MemberRole.OWNER });
    mockGetServerSession.mockResolvedValueOnce(SESSION as any);
    mockGetTripMembership.mockResolvedValueOnce(member as any);
    const handler = vi.fn().mockResolvedValue({ status: 200 });

    await withTripAuth('trip-1', MemberRole.VIEWER, handler);
    expect(handler).toHaveBeenCalled();
  });

  it('calls the handler when COLLABORATOR satisfies VIEWER requirement', async () => {
    const member = makeTripMember({ role: MemberRole.COLLABORATOR });
    mockGetServerSession.mockResolvedValueOnce(SESSION as any);
    mockGetTripMembership.mockResolvedValueOnce(member as any);
    const handler = vi.fn().mockResolvedValue({ status: 200 });

    await withTripAuth('trip-1', MemberRole.VIEWER, handler);
    expect(handler).toHaveBeenCalled();
  });

  it('returns 403 when COLLABORATOR does not satisfy OWNER requirement', async () => {
    const member = makeTripMember({ role: MemberRole.COLLABORATOR });
    mockGetServerSession.mockResolvedValueOnce(SESSION as any);
    mockGetTripMembership.mockResolvedValueOnce(member as any);
    const response = await withTripAuth('trip-1', MemberRole.OWNER, vi.fn());
    expect((response as any).status).toBe(403);
  });

  it('returns 403 when VIEWER does not satisfy COLLABORATOR requirement', async () => {
    const member = makeTripMember({ role: MemberRole.VIEWER });
    mockGetServerSession.mockResolvedValueOnce(SESSION as any);
    mockGetTripMembership.mockResolvedValueOnce(member as any);
    const response = await withTripAuth('trip-1', MemberRole.COLLABORATOR, vi.fn());
    expect((response as any).status).toBe(403);
  });

  it('passes the correct context (session, membership, tripId) to the handler', async () => {
    const member = makeTripMember({ role: MemberRole.OWNER });
    mockGetServerSession.mockResolvedValueOnce(SESSION as any);
    mockGetTripMembership.mockResolvedValueOnce(member as any);
    const handler = vi.fn().mockResolvedValue({ status: 200 });

    await withTripAuth('trip-1', MemberRole.VIEWER, handler);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        tripId: 'trip-1',
        session: SESSION,
        membership: member,
      }),
    );
  });
});
