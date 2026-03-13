"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { redirect } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import ButtonForm from "@/components/specific/buttonForm";
import { Checkbox } from "@/components/ui/checkbox";
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

export const createLoginFormSchema = (
  t: (key: string) => string,
  isNewUser: boolean,
) => {
  return z.object({
    email: z.string().email({ message: t("emailInvalid") }),
    name: isNewUser
      ? z.string().min(1, { message: t("nameRequired") })
      : z.string().optional(),
  });
};

const LoginForm = () => {
  const t = useTranslations("auth");
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const loginFormSchema = createLoginFormSchema(t, isNewUser);

  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      name: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginFormSchema>) {
    setLoading(true);
    const response = await login({
      email: values.email,
      name: isNewUser ? values.name : undefined,
    });
    if (!response.success) {
      form.setError("root", {
        message: response.error,
      });
    }
    setLoading(false);
    redirect("/auth/otp?type=sign-in");
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
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/40 transition-all"
                  placeholder={t("emailPlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-red-300 text-xs" />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-2">
          <Checkbox
            id="isNewUser"
            checked={isNewUser}
            onCheckedChange={(checked) => setIsNewUser(checked === true)}
            className="border-white/30 data-[state=checked]:bg-white/20 data-[state=checked]:border-white/40"
          />
          <label
            htmlFor="isNewUser"
            className="text-white/70 text-sm cursor-pointer select-none"
          >
            {t("isNewUser")}
          </label>
        </div>

        {isNewUser && (
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">{t("name")}</FormLabel>
                <FormControl>
                  <Input
                    className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/40 transition-all"
                    placeholder={t("namePlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-300 text-xs" />
              </FormItem>
            )}
          />
        )}

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
