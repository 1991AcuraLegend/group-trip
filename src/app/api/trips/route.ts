import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-helpers';
import { createTripSchema } from '@/validators/trip';

export async function GET() {
  return withAuth(async (session) => {
    const trips = await prisma.trip.findMany({
      where: {
        members: { some: { userId: session.user.id } },
      },
      include: {
        _count: { select: { members: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(trips);
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async (session) => {
    const body = await request.json();
    const result = createTripSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const trip = await prisma.trip.create({
      data: {
        ...result.data,
        startDate: result.data.startDate ? new Date(result.data.startDate) : undefined,
        endDate: result.data.endDate ? new Date(result.data.endDate) : undefined,
        ownerId: session.user.id,
        members: {
          create: { userId: session.user.id, role: 'OWNER' },
        },
      },
    });

    return NextResponse.json(trip, { status: 201 });
  });
}
