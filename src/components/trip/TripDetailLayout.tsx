'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
  const { data: session } = useSession();
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState<'map' | 'planner'>('planner');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  // Initialize mobileView from ?view=map query param (e.g. when navigating from Ideas/Timeline → Map)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'map') setMobileView('map');
  }, []);

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

  // Determine if the current user can edit entries
  const currentMember = trip.members.find((m) => m.userId === session?.user?.id);
  const canEdit = !currentMember || currentMember.role !== 'VIEWER';

  const entryCount = entries
    ? entries.flights.length + entries.lodgings.length + entries.carRentals.length +
      entries.restaurants.length + entries.activities.length
    : undefined;

  const naturalScroll = isMobile && mobileView === 'planner';

  return (
    <div className={naturalScroll ? 'min-h-screen flex flex-col' : 'fixed inset-0 flex flex-col'}>
      <TripHeader
        trip={trip}
        memberCount={memberCount}
        entryCount={entryCount}
        mobileView={mobileView}
        onMobileViewChange={setMobileView}
      />

      {/* Split view */}
      <div className={naturalScroll ? 'flex flex-col lg:flex-row lg:flex-1 lg:overflow-hidden' : 'flex flex-1 overflow-hidden flex-col lg:flex-row'}>
        {/* Entry panel */}
        <div className={naturalScroll
          ? 'flex w-full lg:overflow-hidden lg:w-[540px] lg:flex-none border-b lg:border-b-0 lg:border-r border-sand-200'
          : `${mobileView === 'planner' ? 'flex' : 'hidden'} lg:flex flex-1 w-full overflow-hidden lg:w-[540px] lg:flex-none border-b lg:border-b-0 lg:border-r border-sand-200`
        }>
          <EntryPanel
            tripId={tripId}
            canEdit={canEdit}
            selectedEntryId={selectedEntryId}
            naturalScroll={naturalScroll}
            onSelectEntry={(entryId) => {
              setSelectedEntryId(entryId);
              if (isMobile) setMobileView('map');
            }}
          />
        </div>

        {/* Map */}
        <div className={`${mobileView === 'map' ? 'flex' : 'hidden'} lg:flex flex-1 relative w-full lg:flex-1`}>
          <TripMap entries={mappableEntries} visible={mobileView === 'map'} selectedEntryId={selectedEntryId} onSelectEntry={setSelectedEntryId} />
        </div>
      </div>
    </div>
  );
}
