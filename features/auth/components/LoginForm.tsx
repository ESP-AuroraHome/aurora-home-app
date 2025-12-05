"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ButtonForm from "@/components/specific/buttonForm";
import login from "../usecase/login";
import { useState } from "react";
import { redirect } from "next/navigation";

export const loginFormSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  email: z.string().email({ message: "Please enter a valid email address." }),
});

const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginFormSchema>) {
    setLoading(true);
    const response = await login({
      username: values.username,
      email: values.email,
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="shadcn" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="shadcn@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <ButtonForm loading={loading} text="Login" />
      </form>
    </Form>
  );
};

export default LoginForm;
