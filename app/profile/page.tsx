import { cookies } from "next/headers";
import Header from "@/components/specific/header";
import ProfilePageContent from "@/features/profile/components/ProfilePageContent";
import getUserProfile from "@/features/profile/usecase/getUserProfile";
import { User } from "@prisma/client";

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

export default async function ProfilePage() {
  const profileResult = await getUserProfile();
  
  let user: User;
  
  if (!profileResult.success) {
    user = getFakeUser();
  } else {
    user = profileResult.data;
  }

  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "fr";

  return (
    <div className="flex flex-col gap-6 p-6 pb-0 h-screen w-full bg-[url('/assets/background-main.jpg')] bg-cover overflow-auto">
      <Header />
      <ProfilePageContent user={user} locale={locale} />
    </div>
  );
}
