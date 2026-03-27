import { headers } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";
import { userRepository } from "@/features/profile/repository/userRepository";
import { auth } from "@/lib/auth";

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

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <Image
        src="/assets/background-main.jpg"
        fill
        alt="Background"
        className="object-cover object-center"
        priority
      />
      {children}
    </div>
  );
};
export default ConnectedLayout;
