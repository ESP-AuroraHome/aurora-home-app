"use client";

import { useState, useMemo } from "react";
import { createAvatar } from "@dicebear/core";
import { SquarePen } from "lucide-react";
import { adventurer } from "@dicebear/collection";
import { avataaars } from "@dicebear/collection";
import { bottts } from "@dicebear/collection";
import { funEmoji } from "@dicebear/collection";
import { identicon } from "@dicebear/collection";
import { lorelei } from "@dicebear/collection";
import { micah } from "@dicebear/collection";
import { miniavs } from "@dicebear/collection";
import { openPeeps } from "@dicebear/collection";
import { personas } from "@dicebear/collection";
import { pixelArt } from "@dicebear/collection";
import { shapes } from "@dicebear/collection";
import { thumbs } from "@dicebear/collection";

interface AvatarSelectorProps {
  currentAvatar: string | null;
  userName: string;
  onSelect: (avatarUrl: string) => void;
}

const avatarStyles = [
  { name: "adventurer", generator: adventurer },
  { name: "avataaars", generator: avataaars },
  { name: "bottts", generator: bottts },
  { name: "fun-emoji", generator: funEmoji },
  { name: "identicon", generator: identicon },
  { name: "lorelei", generator: lorelei },
  { name: "micah", generator: micah },
  { name: "miniavs", generator: miniavs },
  { name: "open-peeps", generator: openPeeps },
  { name: "personas", generator: personas },
  { name: "pixel-art", generator: pixelArt },
  { name: "shapes", generator: shapes },
  { name: "thumbs", generator: thumbs },
];

const generateAvatar = (style: { name: string; generator: any }, seed: string) => {
  const avatar = createAvatar(style.generator, {
    seed: seed,
    size: 128,
  });
  return avatar.toDataUri();
};

export default function AvatarSelector({
  currentAvatar,
  userName,
  onSelect,
}: AvatarSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const avatarOptions = useMemo(
    () =>
      avatarStyles.map((style) => ({
        style: style.name,
        url: generateAvatar(style, userName),
      })),
    [userName]
  );

  const handleSelect = (avatarUrl: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(avatarUrl);
    setIsOpen(false);
  };

  const toggleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <div className="relative w-16 h-16 group">
        <div
          className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-semibold border border-white/30 overflow-hidden cursor-pointer hover:border-white/50 active:border-white/50 transition-all"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          onClick={(e) => e.stopPropagation()}
        >
          {currentAvatar ? (
            <img
              src={currentAvatar}
              alt={userName}
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={avatarOptions[0].url}
              alt={userName}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <button
          type="button"
          onClick={toggleOpen}
          className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 hover:opacity-100 active:opacity-100 transition-opacity cursor-pointer"
          aria-label="Changer l'avatar"
        >
          <SquarePen className="w-5 h-5 text-white" />
        </button>
      </div>

      {isOpen && (
        <div
          className="fixed sm:absolute top-1/2 sm:top-0 left-1/2 sm:left-20 -translate-x-1/2 sm:translate-x-0 -translate-y-1/2 sm:translate-y-0 z-50 bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl w-[calc(100vw-2rem)] max-w-[400px] sm:w-[400px]"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white text-sm font-semibold">
              Choisir un avatar
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="text-white/70 hover:text-white text-xl leading-none sm:hidden"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 max-h-[60vh] sm:max-h-[400px] overflow-y-auto pr-2">
            {avatarOptions.map((option, index) => (
              <div
                key={index}
                className="relative group"
                onClick={(e) => handleSelect(option.url, e)}
              >
                <div
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 cursor-pointer transition-all ${
                    currentAvatar === option.url
                      ? "border-blue-500 ring-2 ring-blue-500/50"
                      : "border-white/20 hover:border-white/50 active:border-white/50"
                  }`}
                >
                  <img
                    src={option.url}
                    alt={`Avatar ${option.style}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

