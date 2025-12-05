import OtpForm from "@/features/auth/components/OtpForm";
import { SearchParams } from "next/dist/server/request/search-params";
import { redirect } from "next/navigation";
import z from "zod";

export const otpTypeSchema = z.enum(["sign-in", "email-verification"]);

const OTPPage = async ({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) => {
  const type = (await searchParams).type;

  const { success, data: typeData } = otpTypeSchema.safeParse(type);

  if (!success) {
    redirect("/auth");
  }

  return (
    <div>
      <h1 className="text-white uppercase text-center py-20 text-3xl font-medium">
        Connect <br /> to your account
      </h1>
      <div className="border-t border-gray-700 p-10">
        <OtpForm type={typeData} />
      </div>
    </div>
  );
};

export default OTPPage;
