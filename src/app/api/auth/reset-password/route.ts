import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { resetPasswordApiSchema } from "@/validators/auth";
import { ZodError } from "zod";

export async function POST(request: Request) {
  const blocked = await rateLimit(request, "auth");
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const { token, password } = resetPasswordApiSchema.parse(body);

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: { select: { id: true } } },
    });

    if (
      !resetToken ||
      resetToken.usedAt !== null ||
      resetToken.expiresAt < new Date()
    ) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.updateMany({
        where: { userId: resetToken.userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

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
}