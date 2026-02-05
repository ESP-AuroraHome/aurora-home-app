import { cookies } from "next/headers";
import { User } from "@prisma/client";
import ProfileSheetWrapper from "./ProfileSheetWrapper";
import getUserProfile from "../usecase/getUserProfile";

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
