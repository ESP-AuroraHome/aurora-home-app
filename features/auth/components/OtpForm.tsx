"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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

export const loginFormSchema = z.object({
  otp: z.string().min(6).max(6),
});

const OtpForm = ({ type }: { type: z.infer<typeof otpTypeSchema> }) => {
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      otp: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginFormSchema>) {
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem className="justify-center">
              <FormLabel>OTP</FormLabel>
              <FormControl>
                <InputOTP maxLength={6} {...field}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <ButtonForm loading={loading} text="Verify" />
      </form>
    </Form>
  );
};

export default OtpForm;
