import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="glass bg-white rounded-2xl shadow-md border border-sand-200 p-8 flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold font-display text-ocean-900">Reset password</h1>
          <p className="mt-1 text-sm text-sand-500">
            Enter your email and we&apos;ll send you a link
          </p>
        </div>

        <ForgotPasswordForm />

        <p className="text-center text-sm text-sand-500">
          Remember your password?{" "}
          <Link
            href="/login"
            className="text-ocean-600 hover:text-ocean-700 hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
