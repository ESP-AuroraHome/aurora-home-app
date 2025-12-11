import Image from "next/image";
import ProfileSheetProvider from "@/features/profile/components/ProfileSheetProvider";

const header = () => {
  return (
    <header className="grid grid-cols-3 w-full sticky top-0 z-50 backdrop-blur-sm text-white max-w-7xl mx-auto py-2 md:py-3">
      <Image
        className="place-self-start"
        src="/assets/logo/logo-black.png"
        alt="Logo"
        width={32}
        height={32}
        className="md:w-10 md:h-10"
      />
      <p className="place-self-center text-sm md:text-base lg:text-lg">AuroraHome</p>
      <div className="place-self-end">
        <ProfileSheetProvider />
      </div>
    </header>
  );
};

export default header;
