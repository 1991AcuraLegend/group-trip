'use client';

import { useState } from 'react';
import type { Flight, Lodging, CarRental, Restaurant, Activity } from '@prisma/client';
import type { EntryType } from '@/types';
import { ENTRY_LABELS } from '@/lib/constants';
import { useDeleteIdea } from '@/hooks/useEntries';
import { useEntryColors } from '@/hooks/useEntryColors';
import { formatCost } from '@/components/trip/EntryDetails';
import { Modal } from '@/components/ui/Modal';
import { MoveToPlanModal } from '@/components/trip/MoveToPlanModal';
import { FlightIdeaForm } from './forms/idea/FlightIdeaForm';
import { LodgingIdeaForm } from './forms/idea/LodgingIdeaForm';
import { CarRentalIdeaForm } from './forms/idea/CarRentalIdeaForm';
import { RestaurantIdeaForm } from './forms/idea/RestaurantIdeaForm';
import { ActivityIdeaForm } from './forms/idea/ActivityIdeaForm';

type AnyEntry = Flight | Lodging | CarRental | Restaurant | Activity;

type Props = {
  entry: AnyEntry;
  type: EntryType;
  tripId: string;
  canEdit: boolean;
};

function IdeaSummary({ type, entry }: { type: EntryType; entry: AnyEntry }) {
  switch (type) {
    case 'flight': {
      const f = entry as Flight;
      return (
        <>
          <p className="font-semibold text-gray-900 text-sm">{f.departureCity} → {f.arrivalCity}</p>
          {f.airline && <p className="text-xs text-sand-500">{f.airline}</p>}
        </>
      );
    }
    case 'lodging': {
      const l = entry as Lodging;
      return (
        <>
          <p className="font-semibold text-gray-900 text-sm">{l.name}</p>
          <p className="text-xs text-sand-500 truncate">{l.address}</p>
        </>
      );
    }
    case 'carRental': {
      const c = entry as CarRental;
      return (
        <>
          <p className="font-semibold text-gray-900 text-sm">{c.company}</p>
          <p className="text-xs text-sand-500 truncate">{c.pickupAddress}</p>
        </>
      );
    }
    case 'restaurant': {
      const r = entry as Restaurant;
      return (
        <>
          <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
          <p className="text-xs text-sand-500 truncate">{r.address}</p>
        </>
      );
    }
    case 'activity': {
      const a = entry as Activity;
      return (
        <>
          <p className="font-semibold text-gray-900 text-sm">{a.name}</p>
          {a.address && <p className="text-xs text-sand-500 truncate">{a.address}</p>}
        </>
      );
    }
  }
}

export function IdeaCard({ entry, type, tripId, canEdit }: Props) {
  const deleteIdea = useDeleteIdea(tripId);
  const entryColors = useEntryColors();
  const color = entryColors[type];
  const [showNotes, setShowNotes] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [moveToPlanOpen, setMoveToPlanOpen] = useState(false);
  const notes = (entry as { notes?: string | null }).notes;
  const cost = (entry as { cost?: number | null }).cost;

  async function handleDelete() {
    if (!window.confirm(`Delete this ${ENTRY_LABELS[type].toLowerCase()} idea?`)) return;
    await deleteIdea.mutateAsync({ entryId: entry.id, type });
  }

  function renderEditForm() {
    switch (type) {
      case 'flight':
        return <FlightIdeaForm tripId={tripId} onClose={() => setEditOpen(false)} existingIdea={entry as Flight} />;
      case 'lodging':
        return <LodgingIdeaForm tripId={tripId} onClose={() => setEditOpen(false)} existingIdea={entry as Lodging} />;
      case 'carRental':
        return <CarRentalIdeaForm tripId={tripId} onClose={() => setEditOpen(false)} existingIdea={entry as CarRental} />;
      case 'restaurant':
        return <RestaurantIdeaForm tripId={tripId} onClose={() => setEditOpen(false)} existingIdea={entry as Restaurant} />;
      case 'activity':
        return <ActivityIdeaForm tripId={tripId} onClose={() => setEditOpen(false)} existingIdea={entry as Activity} />;
    }
  }

  return (
    <>
      <div
        className="glass rounded-lg bg-white border border-sand-200 shadow-sm overflow-hidden"
        style={{ borderLeftWidth: 4, borderLeftColor: color }}
      >
        <div className="p-3 flex gap-2">
          <div className="flex-1 min-w-0">
            <IdeaSummary type={type} entry={entry} />
            {cost != null && cost > 0 && (
              <p className="text-xs text-sand-500 mt-0.5">{formatCost(cost)}</p>
            )}
            {notes && (
              <div className="mt-1">
                <button
                  onClick={() => setShowNotes((v) => !v)}
                  className="text-xs text-sand-400 hover:text-sand-600"
                >
                  {showNotes ? '▲ Hide notes' : '▼ Notes'}
                </button>
                {showNotes && <p className="mt-1 text-xs text-sand-600 whitespace-pre-wrap">{notes}</p>}
              </div>
            )}
          </div>
          {canEdit && (
            <div className="flex flex-col gap-1 shrink-0">
              <button
                onClick={() => setEditOpen(true)}
                className="p-1.5 rounded text-sand-400 hover:text-ocean-600 hover:bg-ocean-50 transition-colors"
                title="Edit idea"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteIdea.isPending}
                className="p-1.5 rounded text-sand-400 hover:text-coral-600 hover:bg-coral-50 transition-colors disabled:opacity-50"
                title="Delete idea"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Move to Plan button */}
        {canEdit && (
          <div className="px-3 pb-3">
            <button
              onClick={() => setMoveToPlanOpen(true)}
              className="w-full text-center text-xs font-medium text-ocean-600 hover:text-ocean-800 bg-ocean-50 hover:bg-ocean-100 rounded-md py-1.5 transition-colors"
            >
              Move to Plan →
            </button>
          </div>
        )}
      </div>

      {/* Edit idea modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title={`Edit ${ENTRY_LABELS[type]} Idea`}>
        {renderEditForm()}
      </Modal>

      {/* Move to Plan modal */}
      <MoveToPlanModal
        isOpen={moveToPlanOpen}
        onClose={() => setMoveToPlanOpen(false)}
        type={type}
        entry={entry}
        tripId={tripId}
      />
    </>
  );
}
