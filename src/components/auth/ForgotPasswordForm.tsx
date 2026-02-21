"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { forgotPasswordSchema, ForgotPasswordInput } from "@/validators/auth";

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordInput) {
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    // Always show success — don't reveal whether email exists
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-md bg-seafoam-50 p-4 text-sm text-seafoam-800">
        If an account with that email exists, a reset link has been sent.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register("email")}
      />
      <Button type="submit" loading={isSubmitting} className="w-full">
        Send reset link
      </Button>
    </form>
  );
}
