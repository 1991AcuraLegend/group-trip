import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/validators/auth";
import { ZodError } from "zod";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // MVP: log the reset link to the console instead of sending an email
      console.log(
        `Password reset link for ${email}: http://localhost:3000/reset?token=mock-token-${user.id}`
      );
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
