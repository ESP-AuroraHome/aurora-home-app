"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTranslations } from "next-intl";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import ButtonForm from "@/components/specific/buttonForm";
import { useState } from "react";
import { redirect } from "next/navigation";
import { otpTypeSchema } from "@/app/auth/otp/page";
import signInOtp from "../usecase/signInOtp";

export const createOtpFormSchema = (t: (key: string) => string) => {
  return z.object({
    otp: z.string().min(6, { message: t("otpLength") }).max(6, { message: t("otpLength") }),
  });
};

const OtpForm = ({ type }: { type: z.infer<typeof otpTypeSchema> }) => {
  const t = useTranslations("auth");
  const [loading, setLoading] = useState(false);
  const otpFormSchema = createOtpFormSchema(t);
  
  const form = useForm<z.infer<typeof otpFormSchema>>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: {
      otp: "",
    },
  });

  async function onSubmit(values: z.infer<typeof otpFormSchema>) {
    setLoading(true);
    const response = await signInOtp({
      otp: values.otp,
    });
    if (!response.success) {
      form.setError("root", {
        message: response.error,
      });
    }
    setLoading(false);
    redirect("/");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem className="flex flex-col items-center">
              <FormLabel className="text-white mb-4">{t("otp")}</FormLabel>
              <FormControl>
                <InputOTP maxLength={6} {...field}>
                  <InputOTPGroup className="gap-1">
                    <InputOTPSlot
                      index={0}
                      className="bg-white/10 backdrop-blur-sm border-white/20 text-white data-[active=true]:bg-white/15 data-[active=true]:border-white/40 h-12 w-12 rounded-lg text-lg"
                    />
                    <InputOTPSlot
                      index={1}
                      className="bg-white/10 backdrop-blur-sm border-white/20 text-white data-[active=true]:bg-white/15 data-[active=true]:border-white/40 h-12 w-12 rounded-lg text-lg"
                    />
                    <InputOTPSlot
                      index={2}
                      className="bg-white/10 backdrop-blur-sm border-white/20 text-white data-[active=true]:bg-white/15 data-[active=true]:border-white/40 h-12 w-12 rounded-lg text-lg"
                    />
                    <InputOTPSlot
                      index={3}
                      className="bg-white/10 backdrop-blur-sm border-white/20 text-white data-[active=true]:bg-white/15 data-[active=true]:border-white/40 h-12 w-12 rounded-lg text-lg"
                    />
                    <InputOTPSlot
                      index={4}
                      className="bg-white/10 backdrop-blur-sm border-white/20 text-white data-[active=true]:bg-white/15 data-[active=true]:border-white/40 h-12 w-12 rounded-lg text-lg"
                    />
                    <InputOTPSlot
                      index={5}
                      className="bg-white/10 backdrop-blur-sm border-white/20 text-white data-[active=true]:bg-white/15 data-[active=true]:border-white/40 h-12 w-12 rounded-lg text-lg"
                    />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormMessage className="text-red-300 text-xs mt-2" />
            </FormItem>
          )}
        />

        <ButtonForm
          loading={loading}
          text={t("verify")}
          loadingText={t("verifying")}
          variant="liquid-glass"
        />
      </form>
    </Form>
  );
};

export default OtpForm;
