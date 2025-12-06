"use server";

import usecase from "@/lib/usecase";
import assert from "assert";
import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createAvatar } from "@dicebear/core";
import { adventurer } from "@dicebear/collection";

const generateRandomAvatar = (seed: string): string => {
  const avatar = createAvatar(adventurer, {
    seed: seed,
    size: 128,
  });
  return avatar.toDataUri();
};

const extractNameFromEmail = (email: string): string => {
  const beforeAt = email.split("@")[0];
  const name = beforeAt.split(".")[0];
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

const signInOtp = usecase(async ({ otp }: { otp: string }) => {
  const store = await cookies();
  const email = store.get("otp_email")?.value;

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

  if (!data || !data.user) {
    throw new Error("Failed to verify OTP");
  }

  const userId = data.user.id;

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      const updates: { image?: string; name?: string } = {};

      if (!user.image) {
        updates.image = generateRandomAvatar(user.email || user.id);
      }

      const extractedName = extractNameFromEmail(user.email);
      const needsNameUpdate = !user.name || user.name.trim() === "" || user.name === user.email;

      if (needsNameUpdate) {
        updates.name = extractedName;
      }

      if (Object.keys(updates).length > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: updates,
        });
      }
    }
  }
});

export default signInOtp;
