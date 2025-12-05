import Image from "next/image";
import { Settings } from "lucide-react";
import Link from "next/link";

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
      <Link href={"/settings"} className="place-self-end self-center">
        <Settings size={24} strokeWidth={1} />
      </Link>
    </header>
  );
};

export default header;
