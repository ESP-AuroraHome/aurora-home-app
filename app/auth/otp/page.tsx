import OtpForm from "@/features/auth/components/OtpForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchParams } from "next/dist/server/request/search-params";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import z from "zod";

export const otpTypeSchema = z.enum(["sign-in", "email-verification"]);

const OTPPage = async ({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) => {
  const t = await getTranslations("auth");
  const type = (await searchParams).type;

  const { success, data: typeData } = otpTypeSchema.safeParse(type);

  if (!success) {
    redirect("/auth");
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex flex-col items-center mb-8">
        <Image
          src="/assets/logo/logo-black.png"
          alt="AuroraHome Logo"
          width={56}
          height={56}
          className="mb-4"
        />
      </div>
      
      <Card className="bg-black/4 backdrop-blur-xs border-gray-100/50 rounded-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-white text-2xl font-semibold text-center">
            {t("otpTitle")}
          </CardTitle>
          <p className="text-white/60 text-center text-sm mt-3 font-light">
            {t("otpSubtitle")}
          </p>
        </CardHeader>
        <CardContent>
          <OtpForm type={typeData} />
        </CardContent>
      </Card>
    </div>
  );
};

export default OTPPage;
