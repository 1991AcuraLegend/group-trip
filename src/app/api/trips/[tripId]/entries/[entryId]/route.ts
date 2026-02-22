import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-helpers';
import { getTripMembership } from '@/lib/trip-auth';
import {
  createFlightSchema,
  createLodgingSchema,
  createCarRentalSchema,
  createRestaurantSchema,
  createActivitySchema,
} from '@/validators/entry';
import type { EntryType } from '@/types';

type Params = { params: { tripId: string; entryId: string } };

function getType(request: NextRequest): EntryType | null {
  const type = new URL(request.url).searchParams.get('type');
  const valid: EntryType[] = ['flight', 'lodging', 'carRental', 'restaurant', 'activity'];
  return valid.includes(type as EntryType) ? (type as EntryType) : null;
}

const toDate = (v: string) => new Date(v);

export async function GET(request: NextRequest, { params }: Params) {
  return withAuth(async (session) => {
    const { tripId, entryId } = params;
    const type = getType(request);
    if (!type) return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    const membership = await getTripMembership(tripId, session.user.id);
    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    let entry;
    const where = { id: entryId, tripId };

    switch (type) {
      case 'flight': entry = await prisma.flight.findFirst({ where }); break;
      case 'lodging': entry = await prisma.lodging.findFirst({ where }); break;
      case 'carRental': entry = await prisma.carRental.findFirst({ where }); break;
      case 'restaurant': entry = await prisma.restaurant.findFirst({ where }); break;
      case 'activity': entry = await prisma.activity.findFirst({ where }); break;
    }

    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ type, data: entry });
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  return withAuth(async (session) => {
    const { tripId, entryId } = params;
    const type = getType(request);
    if (!type) return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    const membership = await getTripMembership(tripId, session.user.id);
    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (membership.role === 'VIEWER') return NextResponse.json({ error: 'View-only members cannot edit entries' }, { status: 403 });

    const body = await request.json();
    let entry;

    switch (type) {
      case 'flight': {
        const schema = createFlightSchema.omit({ type: true }).partial();
        const result = schema.safeParse(body);
        if (!result.success) return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 });
        const { departureDate, arrivalDate, ...rest } = result.data;
        entry = await prisma.flight.update({
          where: { id: entryId },
          data: {
            ...rest,
            ...(departureDate && { departureDate: toDate(departureDate) }),
            ...(arrivalDate && { arrivalDate: toDate(arrivalDate) }),
          },
        });
        break;
      }
      case 'lodging': {
        const schema = createLodgingSchema.omit({ type: true }).partial();
        const result = schema.safeParse(body);
        if (!result.success) return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 });
        const { checkIn, checkOut, ...rest } = result.data;
        entry = await prisma.lodging.update({
          where: { id: entryId },
          data: {
            ...rest,
            ...(checkIn && { checkIn: toDate(checkIn) }),
            ...(checkOut && { checkOut: toDate(checkOut) }),
          },
        });
        break;
      }
      case 'carRental': {
        const schema = createCarRentalSchema.omit({ type: true }).partial();
        const result = schema.safeParse(body);
        if (!result.success) return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 });
        const { pickupDate, dropoffDate, ...rest } = result.data;
        entry = await prisma.carRental.update({
          where: { id: entryId },
          data: {
            ...rest,
            ...(pickupDate && { pickupDate: toDate(pickupDate) }),
            ...(dropoffDate && { dropoffDate: toDate(dropoffDate) }),
          },
        });
        break;
      }
      case 'restaurant': {
        const schema = createRestaurantSchema.omit({ type: true }).partial();
        const result = schema.safeParse(body);
        if (!result.success) return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 });
        const { date, ...rest } = result.data;
        entry = await prisma.restaurant.update({
          where: { id: entryId },
          data: { ...rest, ...(date && { date: toDate(date) }) },
        });
        break;
      }
      case 'activity': {
        const schema = createActivitySchema.omit({ type: true }).partial();
        const result = schema.safeParse(body);
        if (!result.success) return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 });
        const { date, ...rest } = result.data;
        entry = await prisma.activity.update({
          where: { id: entryId },
          data: { ...rest, ...(date && { date: toDate(date) }) },
        });
        break;
      }
    }

    return NextResponse.json({ type, data: entry });
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  return withAuth(async (session) => {
    const { tripId, entryId } = params;
    const type = getType(request);
    if (!type) return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    const membership = await getTripMembership(tripId, session.user.id);
    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (membership.role === 'VIEWER') return NextResponse.json({ error: 'View-only members cannot delete entries' }, { status: 403 });

    switch (type) {
      case 'flight': await prisma.flight.delete({ where: { id: entryId } }); break;
      case 'lodging': await prisma.lodging.delete({ where: { id: entryId } }); break;
      case 'carRental': await prisma.carRental.delete({ where: { id: entryId } }); break;
      case 'restaurant': await prisma.restaurant.delete({ where: { id: entryId } }); break;
      case 'activity': await prisma.activity.delete({ where: { id: entryId } }); break;
    }

    return new NextResponse(null, { status: 204 });
  });
}
