import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { User } from "@prisma/client";
import ProfileSheetWrapper from "./ProfileSheetWrapper";

const getFakeUser = (): User => {
  return {
    id: "fake-user-id-123",
    name: "Jean Dupont",
    email: "jean.dupont@example.com",
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

export default async function ProfileSheetProvider() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  let user: User;

  if (!session?.user) {
    user = getFakeUser();
  } else {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    user = dbUser || getFakeUser();
  }

  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "fr";

  return <ProfileSheetWrapper user={user} locale={locale} />;
}

