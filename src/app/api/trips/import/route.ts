import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-helpers';
import { importTripSchema } from '@/validators/import';
import { entryRegistry, ENTRY_TYPES, convertDates } from '@/lib/entry-registry';
import type { EntryType } from '@/types';

export async function POST(request: NextRequest) {
  return withAuth(async (session) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const result = importTripSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten() },
        { status: 400 }
      );
    }

    const { trip: tripData, entries } = result.data;
    const userId = session.user.id;

    const trip = await prisma.$transaction(async (tx) => {
      const newTrip = await tx.trip.create({
        data: {
          name: tripData.name,
          description: tripData.description ?? null,
          startDate: tripData.startDate ? new Date(tripData.startDate) : null,
          endDate: tripData.endDate ? new Date(tripData.endDate) : null,
          ownerId: userId,
          members: {
            create: { userId, role: 'OWNER' },
          },
        },
      });

      for (const entryType of ENTRY_TYPES) {
        const config = entryRegistry[entryType];
        const items = entries[config.pluralKey as keyof typeof entries] as Record<string, unknown>[];

        for (const item of items) {
          const withDates = convertDates(entryType as EntryType, item);
          await config.delegate(tx as never).create({
            data: {
              ...withDates,
              tripId: newTrip.id,
              createdById: userId,
              isIdea: false,
            },
          });
        }
      }

      return newTrip;
    });

    return NextResponse.json({ tripId: trip.id }, { status: 201 });
  });
}
