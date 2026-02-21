'use client';

import { useState } from 'react';
import { useTrip } from '@/hooks/useTrips';
import { useEntries } from '@/hooks/useEntries';
import { useIsMobile } from '@/hooks/useIsMobile';
import { entriesToMappable } from '@/lib/entry-helpers';
import { TripHeader } from './TripHeader';
import { EntryPanel } from './EntryPanel';
import TripMap from '@/components/map/TripMap';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

type Props = { tripId: string };

export function TripDetailLayout({ tripId }: Props) {
  const { data: trip, isLoading: tripLoading, error: tripError } = useTrip(tripId);
  const { data: entries } = useEntries(tripId);
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState<'map' | 'planner'>('map');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

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
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row pb-14 lg:pb-0">
        {/* Entry panel — hidden on mobile when map is active, full-width when planner is active, 540px fixed on desktop */}
        <div className={`${mobileView === 'planner' ? 'flex' : 'hidden'} lg:flex flex-1 w-full overflow-hidden lg:w-[540px] lg:flex-none border-b lg:border-b-0 lg:border-r border-sand-200`}>
          <EntryPanel
            tripId={tripId}
            selectedEntryId={selectedEntryId}
            onSelectEntry={(entryId) => {
              setSelectedEntryId(entryId);
              // On mobile: switch to map view when entry is selected
              // On desktop: keep the current view, just highlight the entry
              if (isMobile) {
                setMobileView('map');
              }
            }}
          />
        </div>

        {/* Map — full-screen on mobile when map is active, hidden when planner is active, fills right on desktop */}
        <div className={`${mobileView === 'map' ? 'flex' : 'hidden'} lg:flex flex-1 relative w-full lg:flex-1`}>
          <TripMap entries={mappableEntries} visible={mobileView === 'map'} selectedEntryId={selectedEntryId} onSelectEntry={setSelectedEntryId} />
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex border-t border-sand-200 bg-white lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <button
          onClick={() => setMobileView('planner')}
          className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${mobileView === 'planner' ? 'text-ocean-600' : 'text-sand-500'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          Planner
        </button>
        <button
          onClick={() => setMobileView('map')}
          className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${mobileView === 'map' ? 'text-ocean-600' : 'text-sand-500'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Map
        </button>
      </nav>
    </div>
  );
}
