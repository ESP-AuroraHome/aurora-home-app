import LoginForm from "@/features/auth/components/LoginForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

const LoginPage = async () => {
  const t = await getTranslations("auth");

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
            {t("loginTitle")}
          </CardTitle>
          <p className="text-white/60 text-center text-sm mt-3 font-light">
            {t("loginSubtitle")}
          </p>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
