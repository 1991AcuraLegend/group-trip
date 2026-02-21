import { prisma } from './prisma';

// Returns the TripMember record if user is a member, null otherwise
export async function getTripMembership(tripId: string, userId: string) {
  return prisma.tripMember.findUnique({
    where: { userId_tripId: { userId, tripId } },
  });
}

// Check if user is trip owner
export async function isTripOwner(tripId: string, userId: string) {
  const member = await getTripMembership(tripId, userId);
  return member?.role === 'OWNER';
}
