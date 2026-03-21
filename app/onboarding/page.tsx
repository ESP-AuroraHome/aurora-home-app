import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { userRepository } from "@/features/profile/repository/userRepository";
import OnboardingFlow from "@/features/onboarding/components/OnboardingFlow";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = await userRepository.findById(session.user.id);

  if (!user) {
    redirect("/auth/login");
  }

  return <OnboardingFlow user={user} />;
}
