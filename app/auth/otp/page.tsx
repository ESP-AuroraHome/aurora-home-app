import type { SearchParams } from "next/dist/server/request/search-params";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OtpForm from "@/features/auth/components/OtpForm";

export const otpTypeSchema = z.enum(["sign-in", "email-verification"]);

const OTPPage = async ({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) => {
  const t = await getTranslations("auth");
  const type = (await searchParams).type;

  const { success } = otpTypeSchema.safeParse(type);

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

      <Card className="bg-black/20 backdrop-blur-md border-0 rounded-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-white text-2xl font-semibold text-center">
            {t("otpTitle")}
          </CardTitle>
          <p className="text-slate-200 text-center text-sm mt-3 font-light">
            {t("otpSubtitle")}
          </p>
        </CardHeader>
        <CardContent>
          <OtpForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default OTPPage;
