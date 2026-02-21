import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerApiSchema } from "@/validators/auth";
import { ZodError } from "zod";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = registerApiSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json(user, { status: 201 });
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
