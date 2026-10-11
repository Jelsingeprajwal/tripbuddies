import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

interface RegisterRequestBody {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    const body: RegisterRequestBody = await request.json();
    // 1. Validate required fields
    if (
      typeof body !== "object" ||
      body === null ||
      !("firstName" in body) ||
      !("lastName" in body) ||
      !("email" in body) ||
      !("password" in body)
    ) {
      return NextResponse.json(
        {
          message: "First name, last name, email, and password are required.",
        },
        { status: 400 },
      );
    }

    const { firstName, lastName, email, password } = body;

    // 2. Validate input types
    if (
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return NextResponse.json(
        { message: "Invalid input types." },
        { status: 400 },
      );
    }

    // 3. Normalize input
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // 4. Validate names
    if (
      normalizedFirstName.length === 0 ||
      normalizedFirstName.length > 50 ||
      normalizedLastName.length === 0 ||
      normalizedLastName.length > 50
    ) {
      return NextResponse.json(
        {
          message:
            "First and last names must each be between 1 and 50 characters.",
        },
        { status: 400 },
      );
    }

    // 5. Combine names for the existing Prisma schema
    const name = `${normalizedFirstName} ${normalizedLastName}`;

    if (name.length > 100) {
      return NextResponse.json(
        { message: "Full name cannot exceed 100 characters." },
        { status: 400 },
      );
    }

    // 6. Validate email
    if (
      normalizedEmail.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return NextResponse.json(
        { message: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    // 7. Validate password
    if (password.length < 8 || password.length > 72) {
      return NextResponse.json(
        { message: "Password must be between 8 and 72 characters." },
        { status: 400 },
      );
    }

    // 8. Check whether the email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email already exists." },
        { status: 409 },
      );
    }

    // 9. Hash the password before storing it
    const passwordHash = await hash(password, 12);

    // 10. Create the user and return only safe fields
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Account created successfully.",
        user,
      },
      { status: 201 },
    );
  } catch (error) {
    // Handle malformed JSON
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Request body must contain valid JSON." },
        { status: 400 },
      );
    }

    // Handle duplicate email race conditions
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "An account with this email already exists." },
        { status: 409 },
      );
    }

    console.error("Registration error:", error);

    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
