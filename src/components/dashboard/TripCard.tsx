'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import type { TripWithMemberCount } from '@/types';

type Props = {
  trip: TripWithMemberCount;
};

const COVER_GRADIENTS = [
  'from-ocean-400 to-ocean-600',
  'from-seafoam-300 to-ocean-500',
  'from-coral-400 to-coral-600',
  'from-sand-300 to-coral-400',
  'from-ocean-300 to-seafoam-400',
];

function formatDateRange(start?: string | Date | null, end?: string | Date | null): string | null {
  if (!start && !end) return null;
  const fmt = (d: string | Date) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return `From ${fmt(start)}`;
  return `Until ${fmt(end!)}`;
}

export function TripCard({ trip }: Props) {
  const router = useRouter();
  const gradient = COVER_GRADIENTS[trip.id.charCodeAt(0) % COVER_GRADIENTS.length];
  const dateRange = formatDateRange(trip.startDate, trip.endDate);

  return (
    <Card onClick={() => router.push(`/trips/${trip.id}`)}>
      {/* Cover image / gradient */}
      <div className="relative h-40 w-full">
        {trip.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={trip.coverImage}
            alt={trip.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${gradient}`} />
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-ocean-900 truncate">{trip.name}</h3>

        {trip.description && (
          <p className="mt-1 text-sm text-sand-500 line-clamp-2">{trip.description}</p>
        )}

        <div className="mt-3 flex items-center justify-between text-xs text-sand-400">
          {dateRange ? (
            <span>{dateRange}</span>
          ) : (
            <span className="italic">No dates set</span>
          )}
          <span className="inline-flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {trip._count.members} {trip._count.members === 1 ? 'member' : 'members'}
          </span>
        </div>
      </div>
    </Card>
  );
}
