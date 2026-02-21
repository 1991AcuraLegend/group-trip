import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-helpers';
import { createEntrySchema } from '@/validators/entry';
import { getTripMembership } from '@/lib/trip-auth';

type Params = { params: { tripId: string } };

export async function GET(_request: NextRequest, { params }: Params) {
  return withAuth(async (session) => {
    const { tripId } = params;

    const membership = await getTripMembership(tripId, session.user.id);
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [flights, lodgings, carRentals, restaurants, activities] = await Promise.all([
      prisma.flight.findMany({ where: { tripId }, orderBy: { departureDate: 'asc' } }),
      prisma.lodging.findMany({ where: { tripId }, orderBy: { checkIn: 'asc' } }),
      prisma.carRental.findMany({ where: { tripId }, orderBy: { pickupDate: 'asc' } }),
      prisma.restaurant.findMany({ where: { tripId }, orderBy: { date: 'asc' } }),
      prisma.activity.findMany({ where: { tripId }, orderBy: { date: 'asc' } }),
    ]);

    return NextResponse.json({ flights, lodgings, carRentals, restaurants, activities });
  });
}

export async function POST(request: NextRequest, { params }: Params) {
  return withAuth(async (session) => {
    const { tripId } = params;

    const membership = await getTripMembership(tripId, session.user.id);
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = createEntrySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const toDate = (v: string) => new Date(v);

    switch (result.data.type) {
      case 'flight': {
        const { type, ...data } = result.data;
        const entry = await prisma.flight.create({
          data: {
            ...data,
            departureDate: toDate(data.departureDate),
            arrivalDate: toDate(data.arrivalDate),
            tripId,
            createdById: session.user.id,
          },
        });
        return NextResponse.json({ type, data: entry }, { status: 201 });
      }
      case 'lodging': {
        const { type, ...data } = result.data;
        const entry = await prisma.lodging.create({
          data: {
            ...data,
            checkIn: toDate(data.checkIn),
            checkOut: toDate(data.checkOut),
            tripId,
            createdById: session.user.id,
          },
        });
        return NextResponse.json({ type, data: entry }, { status: 201 });
      }
      case 'carRental': {
        const { type, ...data } = result.data;
        const entry = await prisma.carRental.create({
          data: {
            ...data,
            pickupDate: toDate(data.pickupDate),
            dropoffDate: toDate(data.dropoffDate),
            tripId,
            createdById: session.user.id,
          },
        });
        return NextResponse.json({ type, data: entry }, { status: 201 });
      }
      case 'restaurant': {
        const { type, ...data } = result.data;
        const entry = await prisma.restaurant.create({
          data: {
            ...data,
            date: toDate(data.date),
            tripId,
            createdById: session.user.id,
          },
        });
        return NextResponse.json({ type, data: entry }, { status: 201 });
      }
      case 'activity': {
        const { type, ...data } = result.data;
        const entry = await prisma.activity.create({
          data: {
            ...data,
            date: toDate(data.date),
            tripId,
            createdById: session.user.id,
          },
        });
        return NextResponse.json({ type, data: entry }, { status: 201 });
      }
    }
  });
}
