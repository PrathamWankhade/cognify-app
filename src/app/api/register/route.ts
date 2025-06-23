// src/app/api/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, password } = body;

    if (!email || !name || !password) {
      return new NextResponse("Missing name, email, or password", { status: 400 });
    }

    // Check if a user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return new NextResponse("User with this email already exists", { status: 409 }); // 409 Conflict
    }

    // Hash the password for security
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the new user in the database
    const user = await prisma.user.create({
      data: {
        email,
        name,
        hashedPassword,
      },
    });

    // Don't return the password hash in the response
    // THIS IS THE FIX: The comment below disables the linting rule for the next line only.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { hashedPassword: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("REGISTRATION_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}