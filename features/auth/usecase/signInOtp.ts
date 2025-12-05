"use server";

import usecase from "@/lib/usecase";
import assert from "assert";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";

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

  console.log("SIGN IN OTP DATA:", data);

  assert(!data, "Failed to verify OTP");
});

export default signInOtp;
