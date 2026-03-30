"use server";

import { cookies } from "next/headers";
import { userRepository } from "@/features/profile/repository/userRepository";
import { auth } from "@/lib/auth";
import { clearScreen } from "@/lib/otp-display";
import usecase from "@/lib/usecase";

const generateRandomAvatar = (): string => {
  const randomId = Math.floor(Math.random() * 15) + 1;
  return `/assets/profil/${randomId}.png`;
};

const extractNameFromEmail = (email: string): string => {
  const beforeAt = email.split("@")[0];
  const name = beforeAt.split(".")[0];
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

const signInOtp = usecase(async ({ otp }: { otp: string }) => {
  const store = await cookies();
  const email = store.get("otp_email")?.value;
  const providedName = store.get("otp_name")?.value;

  if (!email) {
    throw new Error("OTP email not found");
  }
  const data = await auth.api.signInEmailOTP({
    body: {
      email,
      otp,
    },
  });

  store.delete("otp_email");
  store.delete("otp_name");

  if (!data || !data.user) {
    throw new Error("Failed to verify OTP");
  }

  clearScreen();

  const userId = data.user.id;

  if (userId) {
    const user = await userRepository.findById(userId);

    if (user) {
      const updates: { image?: string; name?: string } = {};

      if (!user.image) {
        updates.image = generateRandomAvatar();
      }

      const extractedName = providedName || extractNameFromEmail(user.email);
      const needsNameUpdate =
        !user.name || user.name.trim() === "" || user.name === user.email;

      if (needsNameUpdate) {
        updates.name = extractedName;
      }

      if (Object.keys(updates).length > 0) {
        await userRepository.update(user.id, updates);
      }
    }
  }
});

export default signInOtp;
