import { Suspense } from "react";
import { User } from "@prisma/client";
import ProfileCard from "./ProfileCard";
import ProfileSuccessToast from "./ProfileSuccessToast";

interface ProfilePageContentProps {
  user: User;
  locale: string;
}

export default function ProfilePageContent({
  user,
  locale,
}: ProfilePageContentProps) {
  const nameParts = user.name.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  return (
    <div className="flex flex-col gap-6 p-6">
      <Suspense fallback={null}>
        <ProfileSuccessToast />
      </Suspense>
      <ProfileCard
        user={user}
        locale={locale}
        initialData={{
          firstName,
          lastName,
          email: user.email,
          locale,
        }}
      />
    </div>
  );
}

