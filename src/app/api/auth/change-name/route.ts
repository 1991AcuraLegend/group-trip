import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-helpers";
import { changeNameApiSchema } from "@/validators/settings";
import { ZodError } from "zod";

export async function PUT(request: Request) {
  return withAuth(async (session) => {
    try {
      const body = await request.json();
      const { name } = changeNameApiSchema.parse(body);

      await prisma.user.update({
        where: { id: session.user.id },
        data: { name },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}
