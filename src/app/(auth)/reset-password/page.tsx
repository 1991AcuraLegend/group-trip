import Link from "next/link";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="glass bg-white rounded-2xl shadow-md border border-sand-200 p-8 flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold font-display text-ocean-900">
            Set new password
          </h1>
          <p className="mt-1 text-sm text-sand-500">
            Enter your new password below
          </p>
        </div>

        <Suspense fallback={<div className="h-32" />}>
          <ResetPasswordForm />
        </Suspense>

        <p className="text-center text-sm text-sand-500">
          <Link
            href="/login"
            className="text-ocean-600 hover:text-ocean-700 hover:underline font-medium"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}