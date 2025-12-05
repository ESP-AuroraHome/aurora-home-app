"use server";

import usecase from "@/lib/usecase";
import { z } from "zod";
import { loginFormSchema } from "../components/LoginForm";
import { authClient } from "@/lib/auth-client";
import assert from "assert";
import { cookies } from "next/headers";

const login = usecase(async ({ email }: z.infer<typeof loginFormSchema>) => {
  const { data, error } = await authClient.emailOtp.sendVerificationOtp({
    email,
    type: "sign-in",
  });

  const store = await cookies();
  store.set("otp_email", email);

  assert(!data?.success, error?.message || "Failed to send OTP");
});

export default login;
