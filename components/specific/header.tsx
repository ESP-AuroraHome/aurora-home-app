import Image from "next/image";
import ProfileSheetProvider from "@/features/profile/components/ProfileSheetProvider";

const header = () => {
  return (
    <header className="grid grid-cols-3 w-full sticky top-0 text-white">
      <Image
        className="place-self-start"
        src="/assets/logo/logo-black.png"
        alt="Logo"
        width={32}
        height={32}
      />
      <p className="place-self-center">AuroraHome</p>
      <ProfileSheetProvider />
    </header>
  );
};

export default header;
