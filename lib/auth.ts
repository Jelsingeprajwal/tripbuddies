import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("tripbuddies_token")?.value;

    if (!token) {
      return null;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"] },
    );

    return payload.sub ?? null;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "JWT_SECRET is not configured"
    ) {
      throw error;
    }

    return null;
  }
}
