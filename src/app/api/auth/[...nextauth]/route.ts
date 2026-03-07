import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const handler = NextAuth(authOptions);

export { handler as GET };

export async function POST(request: NextRequest, context: unknown) {
	const blocked = await rateLimit(request, "auth");
	if (blocked) {
		return blocked;
	}

	return handler(request, context as never);
}
