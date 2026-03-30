"use client";

import { SquarePen } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

interface AvatarSelectorProps {
  currentAvatar: string | null;
  userName: string;
  onSelect: (avatarUrl: string) => void;
}

export default function AvatarSelector({
  currentAvatar,
  userName,
  onSelect,
}: AvatarSelectorProps) {
  const t = useTranslations("profile");
  const [isOpen, setIsOpen] = useState(false);

  const avatarOptions = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => ({
        style: `Avatar ${i + 1}`,
        id: String(i + 1),
        url: `/assets/profil/${i + 1}.png`,
      })),
    [],
  );

  const currentAvatarUrl =
    avatarOptions.find((opt) => opt.id === currentAvatar)?.url ??
    (currentAvatar
      ? `/assets/profil/${currentAvatar}.png`
      : avatarOptions[0].url);

  const handleSelect = (avatarId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(avatarId);
    setIsOpen(false);
  };

  const toggleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <button
      type="button"
      className="relative"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative w-16 h-16 group">
        <button
          type="button"
          className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-semibold border border-white/30 overflow-hidden cursor-pointer hover:border-white/50 active:border-white/50 transition-all"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={currentAvatarUrl}
            alt={userName}
            className="w-full h-full object-cover"
            width={64}
            height={64}
          />
        </button>
        <button
          type="button"
          onClick={toggleOpen}
          className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 hover:opacity-100 active:opacity-100 transition-opacity cursor-pointer"
          aria-label={t("changeAvatar")}
        >
          <SquarePen className="w-5 h-5 text-white" />
        </button>
      </div>

      {isOpen && (
        <button
          type="button"
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-10 sm:absolute sm:top-full sm:left-0 sm:mt-10 sm:translate-x-0 sm:translate-y-0 z-[9999] bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl w-[calc(100vw-2rem)] max-w-[400px] sm:w-[400px]"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          onClick={(e) => e.stopPropagation()}
          style={{ zIndex: 9999 }}
        >
          <div className="flex items-center justify-between mb-3 relative">
            <h3 className="text-white text-sm font-semibold">
              {t("chooseAvatar")}
            </h3>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="text-white/70 hover:text-white text-xl leading-none sm:hidden relative"
              style={{ zIndex: 10000 }}
              aria-label={t("close")}
            >
              ×
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 max-h-[60vh] sm:max-h-[400px] overflow-y-auto pr-2">
            {avatarOptions.map((option) => (
              <button
                type="button"
                key={option.id}
                className="relative group"
                onClick={(e) => handleSelect(option.id, e)}
              >
                <div
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 cursor-pointer transition-all ${
                    currentAvatar === option.id
                      ? "border-blue-500 ring-2 ring-blue-500/50"
                      : "border-white/20 hover:border-white/50 active:border-white/50"
                  }`}
                >
                  <Image
                    src={option.url}
                    alt={`Avatar ${option.style}`}
                    className="w-full h-full object-cover"
                    width={64}
                    height={64}
                  />
                </div>
              </button>
            ))}
          </div>
        </button>
      )}
    </button>
  );
}
