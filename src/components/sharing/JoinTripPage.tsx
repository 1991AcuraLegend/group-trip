'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useJoinTrip } from '@/hooks/useMembers';

type TripPreview = {
  tripId: string;
  name: string;
  description: string | null;
  ownerName: string;
  memberCount: number;
  alreadyMember: boolean;
};

type Props = { code: string };

export function JoinTripPage({ code }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const joinTrip = useJoinTrip();

  const [preview, setPreview] = useState<TripPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);

  // Fetch trip preview for both authenticated and unauthenticated users
  useEffect(() => {
    fetch(`/api/join/${code}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Invalid share link');
        setPreview(data);
      })
      .catch((err) => setPreviewError(err.message))
      .finally(() => setLoadingPreview(false));
  }, [code]);

  // If authenticated and we have the preview, handle existing member case
  useEffect(() => {
    if (status === 'authenticated' && preview?.alreadyMember) {
      // User is already a member, show this state
    }
  }, [status, preview?.alreadyMember]);

  if (loadingPreview) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (previewError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <p className="text-lg font-semibold font-display text-ocean-900">Invalid link</p>
          <p className="mt-1 text-sm text-sand-500">{previewError}</p>
          {status === 'authenticated' && (
            <Button className="mt-4" onClick={() => router.push('/dashboard')} variant="secondary">
              Go to dashboard
            </Button>
          )}
          {status === 'unauthenticated' && (
            <Button className="mt-4" onClick={() => router.push('/login')} variant="secondary">
              Sign in
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!preview) return null;

  // Unauthenticated user - show sign in prompt with trip info
  if (status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-sand-200 bg-white p-8 shadow-md text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-ocean-100">
            <svg className="h-7 w-7 text-ocean-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold font-display text-ocean-900">{preview.name}</h1>
          {preview.description && (
            <p className="mt-2 text-sm text-gray-600">{preview.description}</p>
          )}
          <div className="mt-4 flex justify-center gap-6 text-sm text-gray-500">
            <span>by {preview.ownerName}</span>
            <span>{preview.memberCount} member{preview.memberCount !== 1 ? 's' : ''}</span>
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-sm text-sand-600">
              Sign in to join this shared trip
            </p>
            <Link href={`/login?callbackUrl=/join/${code}`} className="block">
              <Button className="w-full">Sign in</Button>
            </Link>
            <p className="text-sm text-sand-500">
              Don&apos;t have an account?{' '}
              <Link
                href={`/register?callbackUrl=/join/${code}`}
                className="text-ocean-600 hover:text-ocean-700 hover:underline font-medium"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated but showing loading state
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Authenticated and already a member
  if (preview.alreadyMember) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <p className="text-lg font-semibold font-display text-ocean-900">Already a member</p>
          <p className="mt-1 text-sm text-sand-500">You&apos;re already a member of &quot;{preview.name}&quot;.</p>
          <Button className="mt-4" onClick={() => router.push(`/trips/${preview.tripId}`)}>
            Go to trip
          </Button>
        </div>
      </div>
    );
  }

  // Authenticated and not yet a member - show join prompt
  async function handleJoin() {
    const trip = await joinTrip.mutateAsync(code);
    router.push(`/trips/${trip.id}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-sand-200 bg-white p-8 shadow-md text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-ocean-100">
          <svg className="h-7 w-7 text-ocean-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold font-display text-ocean-900">{preview.name}</h1>
        {preview.description && (
          <p className="mt-2 text-sm text-gray-600">{preview.description}</p>
        )}
        <div className="mt-4 flex justify-center gap-6 text-sm text-gray-500">
          <span>by {preview.ownerName}</span>
          <span>{preview.memberCount} member{preview.memberCount !== 1 ? 's' : ''}</span>
        </div>
        {joinTrip.error && (
          <p className="mt-3 text-sm text-coral-600">{joinTrip.error.message}</p>
        )}
        <Button
          className="mt-6 w-full"
          onClick={handleJoin}
          loading={joinTrip.isPending}
        >
          Join trip
        </Button>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-3 text-sm text-gray-400 hover:text-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
