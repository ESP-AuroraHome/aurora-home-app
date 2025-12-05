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
    <div className="bg-gray-950 w-full h-screen dark text-gray-200">
      {children}
    </div>
  );
};

export default AuthLayout;
