import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-helpers";
import { changePasswordApiSchema } from "@/validators/settings";
import { ZodError } from "zod";

export async function PUT(request: Request) {
  return withAuth(async (session) => {
    try {
      const body = await request.json();
      const { currentPassword, newPassword } = changePasswordApiSchema.parse(body);

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { passwordHash: true },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!passwordMatch) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 401 }
        );
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);

      await prisma.user.update({
        where: { id: session.user.id },
        data: { passwordHash },
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
