import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withTripAuth } from '@/lib/auth-helpers';
import { createEntrySchema, createIdeaEntrySchema } from '@/validators/entry';
import { entryRegistry, ENTRY_TYPES, convertDates } from '@/lib/entry-registry';

type Params = { params: { tripId: string } };

export async function GET(request: NextRequest, { params }: Params) {
  const { tripId } = params;
  return withTripAuth(tripId, 'VIEWER', async () => {
    const isIdeas = new URL(request.url).searchParams.get('ideas') === 'true';

    const results = await Promise.all(
      ENTRY_TYPES.map(async (type) => {
        const config = entryRegistry[type];
        const entries = await config.delegate(prisma).findMany({
          where: { tripId, isIdea: isIdeas },
          orderBy: { createdAt: 'asc' },
        });
        return [config.pluralKey, entries] as const;
      })
    );

    return NextResponse.json(Object.fromEntries(results));
  });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { tripId } = params;
  return withTripAuth(tripId, 'COLLABORATOR', async ({ session }) => {
    const body = await request.json();

    // Route to idea schema when isIdea: true
    if (body.isIdea === true) {
      const result = createIdeaEntrySchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 });
      }
      const { type, ...data } = result.data;
      const config = entryRegistry[type];
      const entry = await config.delegate(prisma).create({
        data: { ...data, tripId, createdById: session.user.id },
      });
      return NextResponse.json({ type, data: entry }, { status: 201 });
    }

    const result = createEntrySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const { type, ...data } = result.data;
    const config = entryRegistry[type];
    const converted = convertDates(type, data as Record<string, unknown>);
    const entry = await config.delegate(prisma).create({
      data: { ...converted, tripId, createdById: session.user.id },
    });
    return NextResponse.json({ type, data: entry }, { status: 201 });
  });
}
