import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withTripAuth } from '@/lib/auth-helpers';
import { entryRegistry, convertDates } from '@/lib/entry-registry';
import type { EntryType } from '@/types';

type Params = { params: { tripId: string; entryId: string } };

function getType(request: NextRequest): EntryType | null {
  const type = new URL(request.url).searchParams.get('type');
  const valid: EntryType[] = ['flight', 'lodging', 'carRental', 'restaurant', 'activity'];
  return valid.includes(type as EntryType) ? (type as EntryType) : null;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { tripId, entryId } = params;
  return withTripAuth(tripId, 'VIEWER', async () => {
    const type = getType(request);
    if (!type) return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    const config = entryRegistry[type];
    const entry = await config.delegate(prisma).findFirst({ where: { id: entryId, tripId } });
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ type, data: entry });
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { tripId, entryId } = params;
  return withTripAuth(tripId, 'COLLABORATOR', async () => {
    const type = getType(request);
    if (!type) return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    const body = await request.json();
    const config = entryRegistry[type];
    const schema = config.createSchema.omit({ type: true }).partial();
    const result = schema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 });

    const converted = convertDates(type, result.data as Record<string, unknown>);
    const entry = await config.delegate(prisma).update({
      where: { id: entryId },
      data: converted,
    });
    return NextResponse.json({ type, data: entry });
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { tripId, entryId } = params;
  return withTripAuth(tripId, 'COLLABORATOR', async () => {
    const type = getType(request);
    if (!type) return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    const config = entryRegistry[type];
    await config.delegate(prisma).delete({ where: { id: entryId } });
    return new NextResponse(null, { status: 204 });
  });
}
