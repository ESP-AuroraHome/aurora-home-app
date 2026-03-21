import type { User } from "@prisma/client";
import { cookies } from "next/headers";
import Image from "next/image";
import Header from "@/components/specific/header";
import ProfilePageContent from "@/features/profile/components/ProfilePageContent";
import getUserProfile from "@/features/profile/usecase/getUserProfile";

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
  const profileResult = await getUserProfile({});

  let user: User;

  if (!profileResult.success) {
    user = getFakeUser();
  } else {
    user = profileResult.data;
  }

  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "fr";

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <Image
        src="/assets/background-main.jpg"
        fill
        alt="Background"
        className="object-cover object-center"
      />
      <div className="flex flex-col gap-6 md:gap-8 lg:gap-12 p-6 md:p-8 lg:p-12 pb-6 md:pb-8 lg:pb-12 overflow-y-auto flex-1 z-10">
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-15 md:gap-8 lg:gap-12">
          <Header />
          <ProfilePageContent user={user} locale={locale} />
        </div>
      </div>
    </div>
  );
}
