import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { forgotPasswordSchema } from "@/validators/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getBaseUrl } from "@/lib/base-url";
import { ZodError } from "zod";

export async function POST(request: Request) {
  const blocked = await rateLimit(request, "auth");
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      await prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.passwordResetToken.create({
        data: { token, userId: user.id, expiresAt },
      });

      const baseUrl = getBaseUrl();
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;
      await sendPasswordResetEmail(email, resetUrl);
    }

    // Always return 200 — don't reveal whether the email exists
    return NextResponse.json({
      message: "If an account exists, a reset link has been sent",
    });
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
