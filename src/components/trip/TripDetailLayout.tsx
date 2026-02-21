'use client';

import { useState } from 'react';
import { useTrip } from '@/hooks/useTrips';
import { useEntries } from '@/hooks/useEntries';
import { entriesToMappable } from '@/lib/entry-helpers';
import { TripHeader } from './TripHeader';
import { EntryPanel } from './EntryPanel';
import TripMap from '@/components/map/TripMap';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';

type Props = { tripId: string };

export function TripDetailLayout({ tripId }: Props) {
  const { data: trip, isLoading: tripLoading, error: tripError } = useTrip(tripId);
  const { data: entries } = useEntries(tripId);
  const [mobileView, setMobileView] = useState<'map' | 'planner'>('map');

  if (tripLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (tripError || !trip) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Trip not found or you don&apos;t have access.</p>
      </div>
    );
  }

  const mappableEntries = entries ? entriesToMappable(entries) : [];
  const memberCount = trip.members.length;
  const entryCount = entries
    ? entries.flights.length + entries.lodgings.length + entries.carRentals.length +
      entries.restaurants.length + entries.activities.length
    : undefined;

  return (
    <div className="flex h-screen flex-col">
      <TripHeader trip={trip} memberCount={memberCount} entryCount={entryCount} />

      {/* Split view */}
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* Entry panel — hidden on mobile when map is active, full-width when planner is active, 540px fixed on desktop */}
        <div className={`${mobileView === 'planner' ? 'flex' : 'hidden'} lg:flex flex-1 w-full overflow-hidden lg:w-[540px] lg:flex-none border-b lg:border-b-0 lg:border-r border-sand-200`}>
          <EntryPanel tripId={tripId} onShowMap={() => setMobileView('map')} />
        </div>

        {/* Map — full-screen on mobile when map is active, hidden when planner is active, fills right on desktop */}
        <div className={`${mobileView === 'map' ? 'flex' : 'hidden'} lg:flex flex-1 relative w-full lg:flex-1`}>
          <TripMap entries={mappableEntries} visible={mobileView === 'map'} />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMobileView('planner')}
            className="absolute top-3 left-3 z-10 lg:hidden bg-white shadow-md"
          >
            Planner
          </Button>
        </div>
      </div>
    </div>
  );
}
