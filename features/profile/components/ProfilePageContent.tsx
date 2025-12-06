import { User } from "@prisma/client";
import ProfileCard from "./ProfileCard";

interface ProfilePageContentProps {
  user: User;
  locale: string;
}

export default function ProfilePageContent({
  user,
  locale,
}: ProfilePageContentProps) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <ProfileCard
        user={user}
        locale={locale}
        initialData={{
          name: user.name,
          email: user.email,
          locale,
        }}
      />
    </div>
  );
}

