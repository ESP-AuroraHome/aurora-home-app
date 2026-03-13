import type { User } from "@prisma/client";
import { cookies } from "next/headers";
import getUserProfile from "../usecase/getUserProfile";
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
  const profileResult = await getUserProfile({});

  let user: User;

  if (!profileResult.success) {
    user = getFakeUser();
  } else {
    user = profileResult.data;
  }

  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "fr";

  return <ProfileSheetWrapper user={user} locale={locale} />;
}
