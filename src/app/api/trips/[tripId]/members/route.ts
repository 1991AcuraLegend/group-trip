import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-helpers';
import { getTripMembership } from '@/lib/trip-auth';

type Params = { params: { tripId: string } };

export async function GET(_request: NextRequest, { params }: Params) {
  return withAuth(async (session) => {
    const { tripId } = params;

    const membership = await getTripMembership(tripId, session.user.id);
    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const members = await prisma.tripMember.findMany({
      where: { tripId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { joinedAt: 'asc' },
    });

    return NextResponse.json(members);
  });
}
