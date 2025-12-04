import ButtonForm from "@/components/specific/buttonForm";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { SearchParams } from "next/dist/server/request/search-params";
import { redirect } from "next/navigation";
import z from "zod";

const OTPPage = async ({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) => {
  const type = (await searchParams).type;

  const { success, data } = z
    .enum(["sign-in", "email-verification", "password-reset"])
    .safeParse(type);

  if (!success) {
    redirect("/auth");
  }

  return (
    <div>
      <h1 className="text-white uppercase text-center py-20 text-3xl font-medium">
        Connect <br /> to your account
      </h1>
      <div className="border-t border-gray-700 p-10">
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
        <ButtonForm loading={false} text="Verify" />
      </div>
    </div>
  );
};

export default OTPPage;
