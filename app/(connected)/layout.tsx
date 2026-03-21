import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { userRepository } from "@/features/profile/repository/userRepository";

const ConnectedLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/login");
  }

  const user = await userRepository.findById(session.user.id);

  if (!user?.onboardingCompleted) {
    redirect("/onboarding");
  }

  return <>{children}</>;
};
export default ConnectedLayout;
