import { headers } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { userRepository } from "@/features/profile/repository/userRepository";

const OnboardingLayout = async ({
  children,
}: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = await userRepository.findById(session.user.id);

  if (user?.onboardingCompleted) {
    redirect("/");
  }

  return (
    <div className="w-full h-screen flex items-center justify-center p-6 overflow-hidden relative">
      <Image
        src="/assets/background-main.jpg"
        fill
        alt="Background"
        className="object-cover object-center"
      />
      <div className="z-10 w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default OnboardingLayout;
