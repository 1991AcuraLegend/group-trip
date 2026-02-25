import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-helpers';
import { isTripOwner } from '@/lib/trip-auth';
import type { MemberRole } from '@prisma/client';

type Params = { params: { tripId: string; memberId: string } };

// PATCH — owner can update a collaborator/viewer's role
export async function PATCH(request: NextRequest, { params }: Params) {
  return withAuth(async (session) => {
    const { tripId, memberId } = params;

    const owner = await isTripOwner(tripId, session.user.id);
    if (!owner) return NextResponse.json({ error: 'Only the trip owner can change roles' }, { status: 403 });

    const target = await prisma.tripMember.findUnique({ where: { id: memberId } });
    if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    if (target.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot change the owner role' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const newRole: MemberRole = body?.role === 'VIEWER' ? 'VIEWER' : 'COLLABORATOR';

    const updated = await prisma.tripMember.update({
      where: { id: memberId },
      data: { role: newRole },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json(updated);
  });
}

// DELETE — owner can remove any non-owner member; non-owners can remove themselves (leave)
export async function DELETE(_request: NextRequest, { params }: Params) {
  return withAuth(async (session) => {
    const { tripId, memberId } = params;

    const target = await prisma.tripMember.findUnique({ where: { id: memberId } });
    if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    const isOwner = await isTripOwner(tripId, session.user.id);
    const isSelf = target.userId === session.user.id;

    if (!isOwner && !isSelf) {
      return NextResponse.json({ error: 'Only the trip owner can remove other members' }, { status: 403 });
    }

    // Owner cannot leave their own trip
    if (isSelf && target.role === 'OWNER') {
      return NextResponse.json({ error: 'Trip owners cannot leave their own trip' }, { status: 400 });
    }

    // Owner cannot remove themselves via this path either
    if (isOwner && isSelf) {
      return NextResponse.json({ error: 'Trip owners cannot remove themselves' }, { status: 400 });
    }

    await prisma.tripMember.delete({ where: { id: memberId } });

    const userId = target.userId;
    await Promise.all([
      prisma.$executeRaw`UPDATE "Flight" SET "attendeeIds" = array_remove("attendeeIds", ${userId}) WHERE "tripId" = ${tripId}`,
      prisma.$executeRaw`UPDATE "Lodging" SET "attendeeIds" = array_remove("attendeeIds", ${userId}) WHERE "tripId" = ${tripId}`,
      prisma.$executeRaw`UPDATE "CarRental" SET "attendeeIds" = array_remove("attendeeIds", ${userId}) WHERE "tripId" = ${tripId}`,
      prisma.$executeRaw`UPDATE "Restaurant" SET "attendeeIds" = array_remove("attendeeIds", ${userId}) WHERE "tripId" = ${tripId}`,
      prisma.$executeRaw`UPDATE "Activity" SET "attendeeIds" = array_remove("attendeeIds", ${userId}) WHERE "tripId" = ${tripId}`,
    ]);

    return new NextResponse(null, { status: 204 });
  });
}
