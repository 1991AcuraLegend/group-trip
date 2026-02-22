'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { Trip } from '@prisma/client';
import { Button } from '@/components/ui/Button';
import { ShareModal } from '@/components/sharing/ShareModal';
import { EditTripModal } from '@/components/trip/EditTripModal';
import { useDeleteTrip } from '@/hooks/useTrips';

type Props = {
  trip: Trip & { _count?: { members: number } };
  memberCount: number;
  entryCount?: number;
};

function formatDateRange(start?: Date | string | null, end?: Date | string | null) {
  if (!start && !end) return null;
  const fmt = (d: Date | string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return `From ${fmt(start)}`;
  return `Until ${fmt(end!)}`;
}

type NavView = 'ideas' | 'planner' | 'timeline';

function SegmentedNav({ tripId, active }: { tripId: string; active: NavView }) {
  const items: { key: NavView; label: string; href: string }[] = [
    { key: 'ideas', label: 'Ideas', href: `/trips/${tripId}/ideas` },
    { key: 'planner', label: 'Planner', href: `/trips/${tripId}` },
    { key: 'timeline', label: 'Timeline', href: `/trips/${tripId}/timeline` },
  ];

  return (
    <nav className="inline-flex items-center rounded-lg border border-sand-200 bg-sand-50 p-0.5 gap-0.5 shrink-0">
      {items.map(({ key, label, href }) => (
        <Link
          key={key}
          href={href}
          className={[
            'px-3 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
            active === key
              ? 'bg-white text-ocean-700 shadow-sm border border-sand-200'
              : 'text-sand-500 hover:text-sand-700',
          ].join(' ')}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function TripHeader({ trip, memberCount, entryCount }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const deleteTrip = useDeleteTrip();
  const [shareOpen, setShareOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const isOwner = session?.user?.id === trip.ownerId;
  const dateRange = formatDateRange(trip.startDate, trip.endDate);

  // Determine active segment
  const activeView: NavView = pathname?.endsWith('/timeline')
    ? 'timeline'
    : pathname?.endsWith('/ideas')
    ? 'ideas'
    : 'planner';

  async function handleDelete() {
    if (!window.confirm(`Delete "${trip.name}"? This cannot be undone.`)) return;
    await deleteTrip.mutateAsync(trip.id);
    router.push('/dashboard');
  }

  return (
    <header className="glass border-b border-sand-200 bg-white px-4 py-3 md:px-6">
      {/* Header: back link | trip name/dates | segmented nav | action buttons */}
      <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:items-center sm:gap-4">
        <div className="w-full flex items-center justify-between sm:contents">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-sm text-sand-500 hover:text-ocean-600 transition-colors shrink-0"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>

          <div className="flex items-center gap-2 shrink-0 sm:order-last">
            {isOwner && (
              <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
                Edit Trip
              </Button>
            )}
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
        </div>

        <div className="w-full sm:w-auto">
          <h1 className="text-lg font-bold font-display text-ocean-900 truncate">{trip.name}</h1>
          <div className="flex items-center gap-3 text-xs text-sand-500">
            {dateRange && <span>{dateRange}</span>}
            <span>
              {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </span>
          </div>
        </div>

        <div className="w-full sm:flex-1 flex justify-center">
          <SegmentedNav tripId={trip.id} active={activeView} />
        </div>
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
      {isOwner && (
        <EditTripModal
          trip={trip}
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
    </header>
  );
}
