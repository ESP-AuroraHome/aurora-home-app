"use server";

import usecase from "@/lib/usecase";
import { authClient } from "@/lib/auth-client";
import assert from "assert";

const verifyEmailOtp = usecase(
  async ({ email, otp }: { email: string; otp: string }) => {
    const { data, error } = await authClient.emailOtp.verifyEmail({
      email,
      otp,
    });

    assert(!data, error?.message || "Failed to verify OTP");
  }
);

export default verifyEmailOtp;
