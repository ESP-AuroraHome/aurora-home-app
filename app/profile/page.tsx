import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Header from "@/components/specific/header";
import ProfilePageContent from "@/features/profile/components/ProfilePageContent";
import { User } from "@prisma/client";

// Données factices pour le test
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
  // Récupérer la session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  let user: User;

  // Si pas de session, utiliser des données factices
  if (!session?.user) {
    user = getFakeUser();
  } else {
    // Récupérer l'utilisateur depuis la base de données
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    // Si l'utilisateur n'existe pas en DB, utiliser des données factices
    user = dbUser || getFakeUser();
  }

  // Récupérer la locale depuis les cookies
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "fr";

  return (
    <div className="flex flex-col gap-6 p-6 pb-0 h-screen w-full bg-[url('/assets/background-main.jpg')] bg-cover overflow-auto">
      <Header />
      <ProfilePageContent user={user} locale={locale} />
    </div>
  );
}
