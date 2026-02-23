import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";
import { getTripMembership } from "./trip-auth";
import type { MemberRole, TripMember } from "@prisma/client";

// Get session or return null
export async function getSession() {
  return getServerSession(authOptions);
}

// Get session or throw 401 — use in API routes
export async function requireAuth() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session;
}

type AuthSession = { user: { id: string; name: string; email: string } };

// Helper for API routes: returns 401 response if not authed
export async function withAuth(
  handler: (session: AuthSession) => Promise<NextResponse>
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return handler(session as AuthSession);
}

const ROLE_WEIGHT: Record<MemberRole, number> = {
  OWNER: 3,
  COLLABORATOR: 2,
  VIEWER: 1,
};

type TripAuthContext = {
  session: AuthSession;
  membership: TripMember;
  tripId: string;
};

// Helper for trip-scoped API routes: checks auth + trip membership + role
export async function withTripAuth(
  tripId: string,
  requiredRole: MemberRole,
  handler: (ctx: TripAuthContext) => Promise<NextResponse>
) {
  return withAuth(async (session) => {
    const membership = await getTripMembership(tripId, session.user.id);
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (ROLE_WEIGHT[membership.role] < ROLE_WEIGHT[requiredRole]) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return handler({ session, membership, tripId });
  });
}
