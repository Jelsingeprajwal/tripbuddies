import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  let event;

  try {
    event = await verifyWebhook(request);
  } catch (error) {
    console.error("Clerk webhook verification failed:", error);

    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  try {
    if (event.type === "user.created") {
      const clerkUser = event.data;

      const primaryEmail = clerkUser.email_addresses.find(
        (email) => email.id === clerkUser.primary_email_address_id,
      )?.email_address;

      if (!primaryEmail) {
        return NextResponse.json(
          { error: "User has no primary email" },
          { status: 400 },
        );
      }

      const name =
        [clerkUser.first_name, clerkUser.last_name].filter(Boolean).join(" ") ||
        "New Traveller";

      await prisma.user.upsert({
        where: { clerkUserId: clerkUser.id },
        update: {
          name,
          email: primaryEmail,
        },
        create: {
          clerkUserId: clerkUser.id,
          name,
          email: primaryEmail,
        },
      });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to sync Clerk user to PostgreSQL:", error);

    return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
  }
}
