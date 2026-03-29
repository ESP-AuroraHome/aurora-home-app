"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import ButtonForm from "@/components/specific/buttonForm";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import login from "../usecase/login";

export const createLoginFormSchema = (t: (key: string) => string) => {
  return z.object({
    email: z.string().email({ message: t("emailInvalid") }),
  });
};

const LoginForm = () => {
  const t = useTranslations("auth");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const loginFormSchema = createLoginFormSchema(t);

  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginFormSchema>) {
    setLoading(true);
    const response = await login({ email: values.email });
    if (!response.success) {
      form.setError("root", {
        message: response.error,
      });
    }
    setLoading(false);
    if (response.success) {
      router.push("/auth/otp?type=sign-in");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">{t("email")}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-slate-200 focus:bg-white/15 focus:border-white/40 transition-all"
                  placeholder={t("emailPlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-red-300 text-xs" />
            </FormItem>
          )}
        />

        <ButtonForm
          loading={loading}
          text={t("login")}
          loadingText={t("loggingIn")}
          variant="liquid-glass"
        />
      </form>
    </Form>
  );
};

export default LoginForm;
