import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="glass bg-white rounded-2xl shadow-md border border-sand-200 p-8 flex flex-col gap-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/TravelPlannerIcon.png"
              alt="TravelPlanner"
              width={64}
              height={64}
              className="w-16 h-16"
            />
          </div>
          <h1 className="text-2xl font-bold font-display text-ocean-900">Welcome back</h1>
          <p className="mt-1 text-sm text-sand-500">Sign in to your account</p>
        </div>

        <Suspense fallback={<div className="h-32" />}>
          <LoginForm />
        </Suspense>

        <div className="flex flex-col items-center gap-2 text-sm text-sand-500">
          <Link
            href="/forgot-password"
            className="text-ocean-600 hover:text-ocean-700 hover:underline"
          >
            Forgot your password?
          </Link>
          <p>
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-ocean-600 hover:text-ocean-700 hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
