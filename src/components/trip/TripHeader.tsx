'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { Trip } from '@prisma/client';
import { Button } from '@/components/ui/Button';
import { ShareModal } from '@/components/sharing/ShareModal';
import { useDeleteTrip } from '@/hooks/useTrips';

type Props = {
  trip: Trip & { _count?: { members: number } };
  memberCount: number;
  entryCount?: number;
};

function formatDateRange(start?: Date | string | null, end?: Date | string | null) {
  if (!start && !end) return null;
  const fmt = (d: Date | string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return `From ${fmt(start)}`;
  return `Until ${fmt(end!)}`;
}

export function TripHeader({ trip, memberCount, entryCount }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const deleteTrip = useDeleteTrip();
  const [shareOpen, setShareOpen] = useState(false);

  const isOwner = session?.user?.id === trip.ownerId;
  const dateRange = formatDateRange(trip.startDate, trip.endDate);

  async function handleDelete() {
    if (!window.confirm(`Delete "${trip.name}"? This cannot be undone.`)) return;
    await deleteTrip.mutateAsync(trip.id);
    router.push('/dashboard');
  }

  return (
    <header className="glass flex items-center gap-4 border-b border-sand-200 bg-white px-4 py-3 md:px-6">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 text-sm text-sand-500 hover:text-ocean-600 transition-colors shrink-0"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Dashboard
      </Link>

      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold font-display text-ocean-900 truncate">{trip.name}</h1>
        <div className="flex items-center gap-3 text-xs text-sand-500">
          {dateRange && <span>{dateRange}</span>}
          <span>
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
          {entryCount != null && entryCount > 0 && (
            <Link
              href={`/trips/${trip.id}/timeline`}
              className="px-2 py-0.5 rounded-full bg-ocean-50 text-ocean-600 hover:bg-ocean-100 transition-colors font-medium"
            >
              Timeline
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button variant="secondary" size="sm" onClick={() => setShareOpen(true)}>
          Share
        </Button>
        {isOwner && (
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            loading={deleteTrip.isPending}
          >
            Delete
          </Button>
        )}
      </div>

      {session?.user?.id && (
        <ShareModal
          tripId={trip.id}
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          currentUserId={session.user.id}
          isOwner={isOwner}
        />
      )}
    </header>
  );
}
