import { PrismaClient } from "@prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";
import { displayOTPOnScreen } from "@/lib/otp-display";

const prisma = new PrismaClient();
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
  plugins: [
    nextCookies(),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (type === "sign-in") {
          console.log(`Sending sign-in OTP ${otp} to email ${email}`);
          displayOTPOnScreen(otp, email);
        } else if (type === "email-verification") {
          console.log(
            `Sending email verification OTP ${otp} to email ${email}`
          );
        } else {
          console.log(`Sending password reset OTP ${otp} to email ${email}`);
        }
      },
    }),
  ],
});
