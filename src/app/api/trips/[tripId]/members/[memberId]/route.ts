import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-helpers';
import { isTripOwner } from '@/lib/trip-auth';

type Params = { params: { tripId: string; memberId: string } };

export async function DELETE(_request: NextRequest, { params }: Params) {
  return withAuth(async (session) => {
    const { tripId, memberId } = params;

    const owner = await isTripOwner(tripId, session.user.id);
    if (!owner) return NextResponse.json({ error: 'Only the trip owner can remove members' }, { status: 403 });

    // Prevent owner from removing themselves
    const target = await prisma.tripMember.findUnique({ where: { id: memberId } });
    if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    if (target.userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot remove yourself from the trip' }, { status: 400 });
    }

    await prisma.tripMember.delete({ where: { id: memberId } });
    return new NextResponse(null, { status: 204 });
  });
}
