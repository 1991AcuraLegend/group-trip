import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-helpers';
import { updateTripSchema } from '@/validators/trip';
import { getTripMembership, isTripOwner } from '@/lib/trip-auth';

type Params = { params: { tripId: string } };

export async function GET(_request: NextRequest, { params }: Params) {
  return withAuth(async (session) => {
    const { tripId } = params;

    const membership = await getTripMembership(tripId, session.user.id);
    if (!membership) {
      const trip = await prisma.trip.findUnique({ where: { id: tripId } });
      return NextResponse.json(
        { error: trip ? 'Forbidden' : 'Not found' },
        { status: trip ? 403 : 404 }
      );
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        flights: true,
        lodgings: true,
        carRentals: true,
        restaurants: true,
        activities: true,
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(trip);
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  return withAuth(async (session) => {
    const { tripId } = params;

    const membership = await getTripMembership(tripId, session.user.id);
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = updateTripSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const trip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        ...result.data,
        startDate: result.data.startDate ? new Date(result.data.startDate) : undefined,
        endDate: result.data.endDate ? new Date(result.data.endDate) : undefined,
      },
    });

    return NextResponse.json(trip);
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  return withAuth(async (session) => {
    const { tripId } = params;

    const owner = await isTripOwner(tripId, session.user.id);
    if (!owner) {
      const membership = await getTripMembership(tripId, session.user.id);
      return NextResponse.json(
        { error: membership ? 'Forbidden' : 'Not found' },
        { status: membership ? 403 : 404 }
      );
    }

    await prisma.trip.delete({ where: { id: tripId } });

    return new NextResponse(null, { status: 204 });
  });
}
