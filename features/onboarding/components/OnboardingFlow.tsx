"use client";

import {
  adventurer,
  avataaars,
  bottts,
  funEmoji,
  identicon,
  lorelei,
  micah,
  miniavs,
  openPeeps,
  personas,
  pixelArt,
  shapes,
  thumbs,
} from "@dicebear/collection";
import { createAvatar, type Style } from "@dicebear/core";
import type { User } from "@prisma/client";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { Stepper } from "@/components/ui/stepper";
import completeOnboarding from "../usecase/completeOnboarding";

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

const generateAvatar = (
  style: { name: string; generator: Style<{ seed: string; size: number }> },
  seed: string,
) => createAvatar(style.generator, { seed, size: 128 }).toDataUri();

const STEPS = [
  { label: "Bienvenue" },
  { label: "Avatar" },
  { label: "Langue" },
];

export default function OnboardingFlow({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);

  const [name, setName] = useState(user.name ?? "");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(
    user.image,
  );
  const [locale, setLocale] = useState<"fr" | "en">("fr");

  const avatarOptions = useMemo(
    () =>
      avatarStyles.map((style) => ({
        style: style.name,
        url: generateAvatar(style, name || user.email),
      })),
    [name, user.email],
  );

  const goNext = () => {
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => s + 1);
      setAnimating(false);
    }, 200);
  };

  const goBack = () => {
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => s - 1);
      setAnimating(false);
    }, 200);
  };

  const handleFinish = () => {
    startTransition(async () => {
      await completeOnboarding({
        name,
        image: selectedAvatar,
        locale,
      });
    });
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-8">
      {/* Logo */}
      <Image
        src="/assets/logo/logo-black.png"
        alt="Aurora Home"
        width={48}
        height={48}
      />

      <Stepper steps={STEPS} currentStep={step} />

      {/* Card */}
      <div
        className={`w-full bg-black/20 backdrop-blur-md rounded-3xl shadow-2xl p-8 transition-all duration-200 ${
          animating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
        }`}
      >
        {step === 0 && (
          <StepWelcome name={name} onChange={setName} onNext={goNext} />
        )}
        {step === 1 && (
          <StepAvatar
            avatarOptions={avatarOptions}
            selected={selectedAvatar}
            onSelect={setSelectedAvatar}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {step === 2 && (
          <StepLocale
            locale={locale}
            onChange={setLocale}
            onFinish={handleFinish}
            onBack={goBack}
            isPending={isPending}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- Step 1: Welcome + name ---------- */
function StepWelcome({
  name,
  onChange,
  onNext,
}: {
  name: string;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-white text-2xl font-semibold mb-2">
          Bienvenue sur Aurora Home
        </h1>
        <p className="text-white/60 text-sm leading-relaxed">
          Commençons par personnaliser votre espace. Comment souhaitez-vous
          être appelé ?
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-white/70 text-xs font-medium uppercase tracking-wider">
          Votre prénom
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ex : Marie"
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-white/50 focus:bg-white/15 transition-all"
          onKeyDown={(e) => e.key === "Enter" && name.trim() && onNext()}
          autoFocus
        />
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!name.trim()}
        className="w-full flex items-center justify-center gap-2 bg-white text-black font-semibold rounded-xl py-3 hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        Continuer
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ---------- Step 2: Avatar ---------- */
function StepAvatar({
  avatarOptions,
  selected,
  onSelect,
  onNext,
  onBack,
}: {
  avatarOptions: { style: string; url: string }[];
  selected: string | null;
  onSelect: (url: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs mb-4 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Retour
        </button>
        <h2 className="text-white text-2xl font-semibold mb-2">
          Choisissez votre avatar
        </h2>
        <p className="text-white/60 text-sm">
          Sélectionnez un style qui vous correspond.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
        {avatarOptions.map((option) => {
          const isSelected = selected === option.url;
          return (
            <button
              key={option.style}
              type="button"
              onClick={() => onSelect(option.url)}
              className={`relative rounded-2xl overflow-hidden border-2 transition-all aspect-square ${
                isSelected
                  ? "border-white ring-2 ring-white/40 scale-105"
                  : "border-white/10 hover:border-white/40"
              }`}
            >
              <Image
                src={option.url}
                alt={option.style}
                fill
                className="object-cover p-1"
              />
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Check className="w-5 h-5 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full flex items-center justify-center gap-2 bg-white text-black font-semibold rounded-xl py-3 hover:bg-white/90 transition-all"
      >
        Continuer
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ---------- Step 3: Locale ---------- */
function StepLocale({
  locale,
  onChange,
  onFinish,
  onBack,
  isPending,
}: {
  locale: "fr" | "en";
  onChange: (v: "fr" | "en") => void;
  onFinish: () => void;
  onBack: () => void;
  isPending: boolean;
}) {
  const languages = [
    { code: "fr" as const, label: "Français" },
    { code: "en" as const, label: "English" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs mb-4 transition-colors disabled:opacity-30"
        >
          <ArrowLeft className="w-3 h-3" />
          Retour
        </button>
        <h2 className="text-white text-2xl font-semibold mb-2">
          Quelle est votre langue ?
        </h2>
        <p className="text-white/60 text-sm">
          L'interface sera affichée dans la langue choisie.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {languages.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => onChange(lang.code)}
            className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all text-left ${
              locale === lang.code
                ? "border-white bg-white/15"
                : "border-white/10 hover:border-white/30 hover:bg-white/5"
            }`}
          >
            <span className="text-white font-medium">{lang.label}</span>
            {locale === lang.code && (
              <Check className="w-4 h-4 text-white ml-auto" />
            )}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onFinish}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 bg-white text-black font-semibold rounded-xl py-3 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isPending ? "Chargement..." : "Accéder au dashboard"}
        {!isPending && <ArrowRight className="w-4 h-4" />}
      </button>
    </div>
  );
}
