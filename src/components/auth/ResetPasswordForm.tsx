"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/validators/auth";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: token ?? "" },
  });

  if (!token) {
    return (
      <div className="rounded-md bg-coral-50 p-4 text-sm text-coral-800">
        Invalid reset link. Please request a new one.
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-md bg-seafoam-50 p-4 text-sm text-seafoam-800">
        Password updated successfully. You can now{" "}
        <Link href="/login" className="underline font-medium">
          sign in
        </Link>{" "}
        with your new password.
      </div>
    );
  }

  async function onSubmit(data: ResetPasswordInput) {
    setServerError(null);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: data.token, password: data.password }),
    });

    if (!res.ok) {
      const body = await res.json();
      setServerError(body.error || "Something went wrong");
      return;
    }

    setSuccess(true);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <input type="hidden" {...register("token")} />
      <Input
        label="New Password"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register("password")}
      />
      <Input
        label="Confirm Password"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      {serverError && (
        <p className="text-sm text-coral-600 text-center">{serverError}</p>
      )}
      <Button type="submit" loading={isSubmitting} className="w-full">
        Reset password
      </Button>
    </form>
  );
}