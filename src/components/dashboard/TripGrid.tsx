'use client';

import { useTrips } from '@/hooks/useTrips';
import { TripCard } from './TripCard';
import { Button } from '@/components/ui/Button';

type Props = {
  onCreateTrip: () => void;
};

export function TripGrid({ onCreateTrip }: Props) {
  const { data: trips, isLoading, error } = useTrips();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg bg-sand-200" style={{ height: 220 }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-center text-sm text-red-600">
        Failed to load trips. Please refresh the page.
      </p>
    );
  }

  return (
    <>
      {trips && trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <div className="rounded-full bg-ocean-100 p-4">
            <svg
              className="h-10 w-10 text-ocean-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-lg font-medium text-ocean-900">No trips yet</p>
            <p className="mt-1 text-sm text-sand-500">Create your first trip to get started!</p>
          </div>
          <Button onClick={onCreateTrip}>Create your first trip</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trips?.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </>
  );
}
