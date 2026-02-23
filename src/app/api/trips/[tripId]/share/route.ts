import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withTripAuth } from '@/lib/auth-helpers';
import { generateShareCode } from '@/lib/share-codes';
import type { MemberRole } from '@prisma/client';

type Params = { params: { tripId: string } };

const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

export async function GET(_request: NextRequest, { params }: Params) {
  const { tripId } = params;
  return withTripAuth(tripId, 'VIEWER', async ({ membership }) => {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { _count: { select: { members: true } } },
    });
    if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isOwner = membership.role === 'OWNER';

    if (isOwner) {
      // Owner sees their own configurable link only
      return NextResponse.json({
        shareCode: trip.shareCode,
        shareUrl: trip.shareCode ? `${baseUrl}/join/${trip.shareCode}` : null,
        shareRole: trip.shareRole,
        viewerShareCode: null,
        viewerShareUrl: null,
        memberCount: trip._count.members,
      });
    } else {
      // Non-owners see only the View Only link
      return NextResponse.json({
        shareCode: null,
        shareUrl: null,
        shareRole: null,
        viewerShareCode: trip.viewerShareCode,
        viewerShareUrl: trip.viewerShareCode ? `${baseUrl}/join/${trip.viewerShareCode}` : null,
        memberCount: trip._count.members,
      });
    }
  });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { tripId } = params;
  return withTripAuth(tripId, 'OWNER', async () => {
    const body = await request.json().catch(() => ({}));
    const shareRole: MemberRole = body?.role === 'VIEWER' ? 'VIEWER' : 'COLLABORATOR';

    const shareCode = generateShareCode();

    // Also ensure a viewer share code exists (auto-generate if missing)
    const existingTrip = await prisma.trip.findUnique({ where: { id: tripId }, select: { viewerShareCode: true } });
    const viewerShareCode = existingTrip?.viewerShareCode ?? generateShareCode();

    await prisma.trip.update({
      where: { id: tripId },
      data: { shareCode, shareRole, viewerShareCode },
    });

    return NextResponse.json({
      shareCode,
      shareUrl: `${baseUrl}/join/${shareCode}`,
      shareRole,
    });
  });
}
