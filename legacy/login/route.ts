// import { NextRequest, NextResponse } from "next/server";
// import { SignJWT } from "jose";
// import { compare } from "bcryptjs";
// import { prisma } from "@/lib/prisma";

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const { email, password } = body;

//     if (
//       typeof email !== "string" ||
//       typeof password !== "string" ||
//       !email.trim() ||
//       !password
//     ) {
//       return NextResponse.json(
//         { message: "Email and password are required" },
//         { status: 400 },
//       );
//     }

//     const normalizedEmail = email.trim().toLowerCase();

//     const user = await prisma.user.findUnique({
//       where: { email: normalizedEmail },
//     });

//     if (!user) {
//       return NextResponse.json(
//         { message: "Invalid email or password" },
//         { status: 401 },
//       );
//     }

//     const isPasswordValid = await compare(password, user.passwordHash);

//     if (!isPasswordValid) {
//       return NextResponse.json(
//         { message: "Invalid email or password" },
//         { status: 401 },
//       );
//     }

//     const secret = process.env.JWT_SECRET;

//     if (!secret) {
//       throw new Error("JWT_SECRET is not configured");
//     }

//     const token = await new SignJWT({ email: user.email })
//       .setProtectedHeader({ alg: "HS256" })
//       .setSubject(user.id)
//       .setIssuedAt()
//       .setExpirationTime("1h")
//       .sign(new TextEncoder().encode(secret));

//     const response = NextResponse.json(
//       {
//         message: "Login successful",
//         user: {
//           id: user.id,
//           name: user.name,
//           email: user.email,
//           profileImage: user.profileImage,
//           bio: user.bio,
//         },
//       },
//       { status: 200 },
//     );

//     response.cookies.set("tripbuddies_token", token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "lax",
//       path: "/",
//       maxAge: 60 * 60,
//     });

//     return response;
//   } catch (error) {
//     if (error instanceof SyntaxError) {
//       return NextResponse.json(
//         { message: "Invalid request body" },
//         { status: 400 },
//       );
//     }

//     console.error("Login error:", error);

//     return NextResponse.json(
//       { message: "Internal server error" },
//       { status: 500 },
//     );
//   }
// }
