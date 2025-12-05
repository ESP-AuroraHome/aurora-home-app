import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const ConnectedLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  console.log("ConnectedLayout session:", session);

  if (!session) {
    redirect("/auth/login");
  }

  return <>{children}</>;
};
export default ConnectedLayout;
