import { headers } from "next/headers";
import { redirect } from "next/navigation";
import OnboardingFlow from "@/features/onboarding/components/OnboardingFlow";
import { userRepository } from "@/features/profile/repository/userRepository";
import { auth } from "@/lib/auth";

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
