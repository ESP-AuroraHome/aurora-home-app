"use server";

import assert from "node:assert";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import usecase from "@/lib/usecase";

const loginSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

const login = usecase(async ({ email, name }: z.infer<typeof loginSchema>) => {
  const requestHeaders = await headers();
  const baseUrl = `${requestHeaders.get("x-forwarded-proto") ?? "http"}://${requestHeaders.get("host")}`;

  const res = await fetch(
    `${baseUrl}/api/auth/email-otp/send-verification-otp`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, type: "sign-in" }),
    },
  );

  const store = await cookies();
  store.set("otp_email", email);
  if (name) {
    store.set("otp_name", name);
  }

  assert(res.ok, `Failed to send OTP: ${res.statusText}`);
});

export default login;
