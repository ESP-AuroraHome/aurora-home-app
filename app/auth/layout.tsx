import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const AuthLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  console.log("ConnectedLayout session:", session);

  if (session) {
    redirect("/");
  }
  return (
    <div className="w-full h-screen bg-[url('/assets/background-main.jpg')] bg-cover bg-center flex items-center justify-center p-6">
      {children}
    </div>
  );
};

export default AuthLayout;
