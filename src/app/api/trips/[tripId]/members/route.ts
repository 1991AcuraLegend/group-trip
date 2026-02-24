import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withTripAuth } from '@/lib/auth-helpers';

type Params = { params: { tripId: string } };

export async function GET(_request: NextRequest, { params }: Params) {
  const { tripId } = params;
  return withTripAuth(tripId, 'VIEWER', async () => {
    const members = await prisma.tripMember.findMany({
      where: { tripId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { joinedAt: 'asc' },
    });

    return NextResponse.json(members);
  });
}
