'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import type { Flight, Lodging, CarRental, Restaurant, Activity } from '@prisma/client';
import type { EntryType } from '@/types';
import { useTrip } from '@/hooks/useTrips';
import { useIdeas } from '@/hooks/useEntries';
import { useIsMobile } from '@/hooks/useIsMobile';
import { ENTRY_LABELS } from '@/lib/constants';
import { TripHeader } from '@/components/trip/TripHeader';
import { IdeaCard } from '@/components/trip/IdeaCard';
import { Modal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ideaFormRegistry } from '@/components/trip/forms/registry';

const TAB_ORDER: EntryType[] = ['flight', 'lodging', 'carRental', 'restaurant', 'activity'];

type Props = { tripId: string };

function IdeaColumn({
  type,
  tripId,
  canEdit,
  entries,
}: {
  type: EntryType;
  tripId: string;
  canEdit: boolean;
  entries: (Flight | Lodging | CarRental | Restaurant | Activity)[];
}) {
  const [addOpen, setAddOpen] = useState(false);

  function renderAddForm() {
    const FormComponent = ideaFormRegistry[type];
    return <FormComponent tripId={tripId} onClose={() => setAddOpen(false)} />;
  }

  return (
    <div className="flex flex-col min-w-0 h-full">
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-sand-200 bg-sand-50 shrink-0">
        <span className="text-sm font-semibold text-sand-700">
          {ENTRY_LABELS[type]}
          {entries.length > 0 && (
            <span className="ml-1.5 text-xs font-medium text-sand-400">({entries.length})</span>
          )}
        </span>
        {canEdit && (
          <Button size="sm" variant="secondary" onClick={() => setAddOpen(true)} className="text-xs px-2 py-1">
            + Add
          </Button>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[80px] text-center">
            <p className="text-sm text-sand-400">No {ENTRY_LABELS[type].toLowerCase()} ideas yet</p>
            {canEdit && (
              <button
                onClick={() => setAddOpen(true)}
                className="mt-1 text-xs text-ocean-500 hover:text-ocean-700"
              >
                + Add one
              </button>
            )}
          </div>
        ) : (
          entries.map((entry) => (
            <IdeaCard key={entry.id} entry={entry} type={type} tripId={tripId} canEdit={canEdit} />
          ))
        )}
      </div>

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title={`Add ${ENTRY_LABELS[type]} Idea`}>
        {renderAddForm()}
      </Modal>
    </div>
  );
}

/* ─── Mobile tabbed view ──────────────────────────────────────────────────── */

function MobileIdeas({
  tripId,
  canEdit,
  data,
}: {
  tripId: string;
  canEdit: boolean;
  data: Record<EntryType, (Flight | Lodging | CarRental | Restaurant | Activity)[]>;
}) {
  const [activeTab, setActiveTab] = useState<EntryType>('flight');
  const [addOpen, setAddOpen] = useState(false);

  const tabs = TAB_ORDER.map((t) => ({
    value: t,
    label: ENTRY_LABELS[t],
    count: data[t].length,
  }));

  function renderAddForm() {
    const FormComponent = ideaFormRegistry[activeTab];
    return <FormComponent tripId={tripId} onClose={() => setAddOpen(false)} />;
  }

  const activeEntries = data[activeTab];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Tabs tabs={tabs} activeTab={activeTab} onChange={(v) => setActiveTab(v as EntryType)} />

      <div className="flex items-center justify-between px-4 py-2 border-b border-sand-200 shrink-0">
        <span className="text-sm font-medium text-sand-700">{ENTRY_LABELS[activeTab]}</span>
        {canEdit && (
          <Button size="sm" onClick={() => setAddOpen(true)}>
            + Add Idea
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {activeEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 min-h-[120px] text-center">
            <p className="text-sand-400">No {ENTRY_LABELS[activeTab].toLowerCase()} ideas yet</p>
            {canEdit && (
              <button
                onClick={() => setAddOpen(true)}
                className="mt-1 text-sm text-ocean-500 hover:text-ocean-700"
              >
                + Add one
              </button>
            )}
          </div>
        ) : (
          activeEntries.map((entry) => (
            <IdeaCard key={entry.id} entry={entry} type={activeTab} tripId={tripId} canEdit={canEdit} />
          ))
        )}
      </div>

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title={`Add ${ENTRY_LABELS[activeTab]} Idea`}>
        {renderAddForm()}
      </Modal>
    </div>
  );
}

/* ─── Main layout ─────────────────────────────────────────────────────────── */

export function IdeasLayout({ tripId }: Props) {
  const { data: trip, isLoading: tripLoading, error: tripError } = useTrip(tripId);
  const { data: ideas, isLoading: ideasLoading } = useIdeas(tripId);
  const { data: session } = useSession();
  const isMobile = useIsMobile();

  if (tripLoading || ideasLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (tripError || !trip) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sand-500">Trip not found or you don&apos;t have access.</p>
      </div>
    );
  }

  const memberCount = trip.members.length;
  const currentMember = trip.members.find((m) => m.userId === session?.user?.id);
  const canEdit = !currentMember || currentMember.role !== 'VIEWER';

  const data: Record<EntryType, (Flight | Lodging | CarRental | Restaurant | Activity)[]> = {
    flight: ideas?.flights ?? [],
    lodging: ideas?.lodgings ?? [],
    carRental: ideas?.carRentals ?? [],
    restaurant: ideas?.restaurants ?? [],
    activity: ideas?.activities ?? [],
  };

  const totalCount = Object.values(data).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TripHeader trip={trip} memberCount={memberCount} entryCount={totalCount} />

      {isMobile ? (
        <MobileIdeas tripId={tripId} canEdit={canEdit} data={data} />
      ) : (
        /* Desktop: one column per category */
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex h-full min-w-max">
            {TAB_ORDER.map((type, index) => (
              <div
                key={type}
                className={`flex flex-col w-72 xl:w-80 shrink-0 h-full ${
                  index < TAB_ORDER.length - 1 ? 'border-r border-sand-200' : ''
                }`}
              >
                <IdeaColumn
                  type={type}
                  tripId={tripId}
                  canEdit={canEdit}
                  entries={data[type]}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
