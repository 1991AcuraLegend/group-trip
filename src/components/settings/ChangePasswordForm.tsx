'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { changePasswordSchema, type ChangePasswordInput } from '@/validators/settings';

export function ChangePasswordForm() {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  async function onSubmit(data: ChangePasswordInput) {
    setServerError('');
    const res = await fetch('/api/auth/change-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    });

    if (res.ok) {
      setSuccess(true);
      reset();
    } else {
      const json = await res.json();
      setServerError(json.error ?? 'Something went wrong. Please try again.');
    }
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-seafoam-50 px-4 py-3 text-sm text-seafoam-800">
          Your password has been updated successfully.
        </div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-ocean-600 hover:text-ocean-700 transition-colors"
        >
          ← Back to Settings
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Current Password"
        type="password"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />
      <Input
        label="New Password"
        type="password"
        autoComplete="new-password"
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <Input
        label="Confirm New Password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmNewPassword?.message}
        {...register('confirmNewPassword')}
      />

      {serverError && (
        <p className="text-sm text-coral-600">{serverError}</p>
      )}

      <Button type="submit" loading={isSubmitting}>
        Update Password
      </Button>
    </form>
  );
}
