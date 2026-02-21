import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";

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

// Helper for API routes: returns 401 response if not authed
export async function withAuth(
  handler: (session: {
    user: { id: string; name: string; email: string };
  }) => Promise<NextResponse>
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return handler(session as { user: { id: string; name: string; email: string } });
}
