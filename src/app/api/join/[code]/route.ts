import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-helpers';

type Params = { params: { code: string } };

export async function GET(_request: NextRequest, { params }: Params) {
  return withAuth(async (session) => {
    const trip = await prisma.trip.findUnique({
      where: { shareCode: params.code },
      include: {
        owner: { select: { name: true } },
        _count: { select: { members: true } },
      },
    });

    if (!trip) return NextResponse.json({ error: 'Invalid or expired share link' }, { status: 404 });

    const alreadyMember = await prisma.tripMember.findUnique({
      where: { userId_tripId: { userId: session.user.id, tripId: trip.id } },
    });

    return NextResponse.json({
      tripId: trip.id,
      name: trip.name,
      description: trip.description,
      ownerName: trip.owner.name,
      memberCount: trip._count.members,
      alreadyMember: !!alreadyMember,
    });
  });
}

export async function POST(_request: NextRequest, { params }: Params) {
  return withAuth(async (session) => {
    const trip = await prisma.trip.findUnique({ where: { shareCode: params.code } });
    if (!trip) return NextResponse.json({ error: 'Invalid or expired share link' }, { status: 404 });

    const existing = await prisma.tripMember.findUnique({
      where: { userId_tripId: { userId: session.user.id, tripId: trip.id } },
    });
    if (existing) return NextResponse.json({ error: 'Already a member of this trip' }, { status: 409 });

    await prisma.tripMember.create({
      data: { userId: session.user.id, tripId: trip.id, role: 'COLLABORATOR' },
    });

    return NextResponse.json(trip);
  });
}
