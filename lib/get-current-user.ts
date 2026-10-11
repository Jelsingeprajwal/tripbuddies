import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const email = clerkUser.emailAddresses.find(
    (address) => address.id === clerkUser.primaryEmailAddressId,
  )?.emailAddress;

  if (!email) {
    throw new Error("Authenticated Clerk user has no primary email.");
  }

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    email;

  const user = await prisma.user.upsert({
    where: {
      clerkUserId: userId,
    },
    update: {
      name,
      email,
    },
    create: {
      clerkUserId: userId,
      name,
      email,
    },
    select: {
      id: true,
      clerkUserId: true,
      name: true,
      email: true,
      profileImage: true,
      bio: true,
    },
  });

  return user;
}
