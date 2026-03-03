import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withTripAuth } from '@/lib/auth-helpers';
import { updateTripSchema } from '@/validators/trip';

type Params = { params: { tripId: string } };

export async function GET(_request: NextRequest, { params }: Params) {
  const { tripId } = params;
  return withTripAuth(tripId, 'VIEWER', async () => {
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
  const { tripId } = params;
  return withTripAuth(tripId, 'COLLABORATOR', async () => {
    const body = await request.json();
    const result = updateTripSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { coverImage, ...rest } = result.data;
    const trip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        ...rest,
        startDate: rest.startDate ? new Date(rest.startDate) : undefined,
        endDate: rest.endDate ? new Date(rest.endDate) : undefined,
        ...(coverImage !== undefined ? { coverImage } : {}),
      },
    });

    return NextResponse.json(trip);
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { tripId } = params;
  return withTripAuth(tripId, 'OWNER', async () => {
    await prisma.trip.delete({ where: { id: tripId } });
    return new NextResponse(null, { status: 204 });
  });
}
