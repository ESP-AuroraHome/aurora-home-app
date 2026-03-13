"use server";

import assert from "node:assert";
import { cookies } from "next/headers";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import usecase from "@/lib/usecase";

const loginSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

const login = usecase(async ({ email, name }: z.infer<typeof loginSchema>) => {
  const { data, error } = await authClient.emailOtp.sendVerificationOtp({
    email,
    type: "sign-in",
  });

  const store = await cookies();
  store.set("otp_email", email);
  if (name) {
    store.set("otp_name", name);
  }

  assert(!data?.success, error?.message || "Failed to send OTP");
});

export default login;
