import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";

// GET /api/users/me
// Fetch the currently authenticated user's profile
export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        bio: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 401 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Get current user error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH /api/users/me
// Update the currently authenticated user's profile
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid request body" },
        { status: 400 },
      );
    }

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json(
        { message: "Request body must be a JSON object" },
        { status: 400 },
      );
    }

    const allowedFields = ["name", "bio", "profileImage"];
    const suppliedFields = Object.keys(body);

    if (
      suppliedFields.length === 0 ||
      suppliedFields.some((field) => !allowedFields.includes(field))
    ) {
      return NextResponse.json(
        { message: "Provide valid profile fields to update" },
        { status: 400 },
      );
    }

    const data: {
      name?: string;
      bio?: string | null;
      profileImage?: string | null;
    } = {};

    if ("name" in body) {
      const name = body.name;

      if (
        typeof name !== "string" ||
        !name.trim() ||
        name.trim().length > 100
      ) {
        return NextResponse.json(
          { message: "Name must be between 1 and 100 characters" },
          { status: 400 },
        );
      }

      data.name = name.trim();
    }

    if ("bio" in body) {
      const bio = body.bio;

      if (bio !== null && (typeof bio !== "string" || bio.length > 500)) {
        return NextResponse.json(
          {
            message: "Bio must be a string of at most 500 characters or null",
          },
          { status: 400 },
        );
      }

      data.bio = bio;
    }

    if ("profileImage" in body) {
      const profileImage = body.profileImage;

      if (
        profileImage !== null &&
        (typeof profileImage !== "string" ||
          !profileImage.trim() ||
          profileImage.length > 2048)
      ) {
        return NextResponse.json(
          {
            message:
              "Profile image must be a non-empty string of at most 2048 characters or null",
          },
          { status: 400 },
        );
      }

      data.profileImage =
        typeof profileImage === "string" ? profileImage.trim() : profileImage;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        bio: true,
      },
    });

    return NextResponse.json(
      {
        message: "Profile updated successfully",
        user,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update profile error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
