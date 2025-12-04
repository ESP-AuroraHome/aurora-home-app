import { PrismaClient } from "@prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";

const prisma = new PrismaClient();
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (type === "sign-in") {
          console.log(`Sending sign-in OTP ${otp} to email ${email}`);
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
