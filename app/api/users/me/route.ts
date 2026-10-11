import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";
import { getCurrentUser } from "@/lib/get-current-user";

// GET /api/users/me
// Fetch the currently authenticated user's profile
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch current user:", error);

    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 },
    );
  }
}

// PATCH /api/users/me
// Update the currently authenticated user's profile

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const allowedFields = ["name", "bio", "profileImage"];
    const unknownFields = Object.keys(body).filter(
      (key) => !allowedFields.includes(key),
    );

    if (unknownFields.length > 0) {
      return NextResponse.json(
        { error: `Unknown fields: ${unknownFields.join(", ")}` },
        { status: 400 },
      );
    }

    const data: {
      name?: string;
      bio?: string | null;
      profileImage?: string | null;
    } = {};

    if ("name" in body) {
      if (
        typeof body.name !== "string" ||
        body.name.trim().length === 0 ||
        body.name.trim().length > 100
      ) {
        return NextResponse.json(
          { error: "Name must be between 1 and 100 characters" },
          { status: 400 },
        );
      }

      data.name = body.name.trim();
    }

    if ("bio" in body) {
      if (
        body.bio !== null &&
        (typeof body.bio !== "string" || body.bio.length > 500)
      ) {
        return NextResponse.json(
          { error: "Bio must be a string of at most 500 characters or null" },
          { status: 400 },
        );
      }

      data.bio = body.bio;
    }

    if ("profileImage" in body) {
      if (
        body.profileImage !== null &&
        (typeof body.profileImage !== "string" ||
          body.profileImage.length > 2048)
      ) {
        return NextResponse.json(
          {
            error:
              "Profile image must be a string of at most 2048 characters or null",
          },
          { status: 400 },
        );
      }

      data.profileImage = body.profileImage;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Provide at least one field to update" },
        { status: 400 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data,
      select: {
        id: true,
        clerkUserId: true,
        name: true,
        email: true,
        profileImage: true,
        bio: true,
      },
    });

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Failed to update user profile:", error);

    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 },
    );
  }
}
