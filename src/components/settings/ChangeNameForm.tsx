'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { changeNameSchema, type ChangeNameInput } from '@/validators/settings';

export function ChangeNameForm() {
  const { data: session, update } = useSession();
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangeNameInput>({
    resolver: zodResolver(changeNameSchema),
    defaultValues: {
      name: session?.user?.name ?? '',
    },
  });

  async function onSubmit(data: ChangeNameInput) {
    setServerError('');
    const res = await fetch('/api/auth/change-name', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.name }),
    });

    if (res.ok) {
      await update({ name: data.name });
      setSuccess(true);
    } else {
      const json = await res.json();
      setServerError(json.error ?? 'Something went wrong. Please try again.');
    }
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-seafoam-50 px-4 py-3 text-sm text-seafoam-800">
          Your name has been updated successfully.
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
        label="Name"
        type="text"
        autoComplete="name"
        error={errors.name?.message}
        {...register('name')}
      />

      {serverError && (
        <p className="text-sm text-coral-600">{serverError}</p>
      )}

      <Button type="submit" loading={isSubmitting}>
        Update Name
      </Button>
    </form>
  );
}
