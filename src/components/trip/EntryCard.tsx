'use client';

import { useState } from 'react';
import type { Flight, Lodging, CarRental, Restaurant, Activity } from '@prisma/client';
import type { EntryType } from '@/types';
import { ENTRY_LABELS } from '@/lib/constants';
import { useDeleteEntry } from '@/hooks/useEntries';
import { useEntryColors } from '@/hooks/useEntryColors';
import { CardBody } from '@/components/trip/EntryDetails';

type Props = {
  entry: Flight | Lodging | CarRental | Restaurant | Activity;
  type: EntryType;
  tripId: string;
  onEdit: (entry: Flight | Lodging | CarRental | Restaurant | Activity) => void;
  isSelected?: boolean;
  onSelect?: () => void;
};

export function EntryCard({ entry, type, tripId, onEdit, isSelected, onSelect }: Props) {
  const deleteEntry = useDeleteEntry(tripId);
  const [showNotes, setShowNotes] = useState(false);
  const notes = (entry as { notes?: string | null }).notes;
  const entryColors = useEntryColors();
  const color = entryColors[type];

  async function handleDelete() {
    if (!window.confirm(`Delete this ${ENTRY_LABELS[type].toLowerCase()}?`)) return;
    await deleteEntry.mutateAsync({ entryId: entry.id, type });
  }

  return (
    <div
      onClick={onSelect}
      className={`glass rounded-lg bg-white border border-sand-200 shadow-sm overflow-hidden cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-ocean-400 ring-offset-2 shadow-md' : 'hover:shadow-md'
      }`}
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <div className="p-2.5 sm:p-3 flex gap-2 sm:gap-3">
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <CardBody type={type} entry={entry} />
          {notes && (
            <div className="mt-1">
              <button
                onClick={() => setShowNotes((v) => !v)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                {showNotes ? '▲ Hide notes' : '▼ Show notes'}
              </button>
              {showNotes && <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{notes}</p>}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          <button
            onClick={() => onEdit(entry)}
            className="p-1.5 rounded text-gray-400 hover:text-ocean-600 hover:bg-ocean-50 transition-colors"
            title="Edit"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteEntry.isPending}
            className="p-1.5 rounded text-gray-400 hover:text-coral-600 hover:bg-coral-50 transition-colors disabled:opacity-50"
            title="Delete"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
