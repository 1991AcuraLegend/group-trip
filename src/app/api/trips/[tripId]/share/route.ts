import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-helpers';
import { getTripMembership, isTripOwner } from '@/lib/trip-auth';
import { generateShareCode } from '@/lib/share-codes';

type Params = { params: { tripId: string } };

const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

export async function GET(_request: NextRequest, { params }: Params) {
  return withAuth(async (session) => {
    const { tripId } = params;

    const membership = await getTripMembership(tripId, session.user.id);
    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { _count: { select: { members: true } } },
    });
    if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      shareCode: trip.shareCode,
      shareUrl: trip.shareCode ? `${baseUrl}/join/${trip.shareCode}` : null,
      memberCount: trip._count.members,
    });
  });
}

export async function POST(_request: NextRequest, { params }: Params) {
  return withAuth(async (session) => {
    const { tripId } = params;

    const owner = await isTripOwner(tripId, session.user.id);
    if (!owner) return NextResponse.json({ error: 'Only the trip owner can generate share links' }, { status: 403 });

    const shareCode = generateShareCode();
    await prisma.trip.update({ where: { id: tripId }, data: { shareCode } });

    return NextResponse.json({
      shareCode,
      shareUrl: `${baseUrl}/join/${shareCode}`,
    });
  });
}
