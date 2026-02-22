'use client';

import type { Flight, Lodging, CarRental, Restaurant, Activity } from '@prisma/client';
import type { EntryType } from '@/types';
import { EntryCard } from './EntryCard';
import { getEntryDate } from '@/lib/entry-helpers';
import { ENTRY_LABELS } from '@/lib/constants';

type Entry = Flight | Lodging | CarRental | Restaurant | Activity;

type Props = {
  entries: Entry[];
  type: EntryType;
  tripId: string;
  canEdit: boolean;
  onEdit: (entry: Entry) => void;
  selectedEntryId: string | null;
  onSelectEntry: (entryId: string | null) => void;
};

export function EntryList({ entries, type, tripId, canEdit, onEdit, selectedEntryId, onSelectEntry }: Props) {
  if (entries.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-sand-400">
        No {ENTRY_LABELS[type].toLowerCase()} added yet
      </div>
    );
  }

  const sorted = [...entries].sort((a, b) => {
    const dateA = getEntryDate(type, a)?.getTime() ?? 0;
    const dateB = getEntryDate(type, b)?.getTime() ?? 0;
    return dateA - dateB;
  });

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((entry) => (
        <EntryCard
          key={entry.id}
          entry={entry}
          type={type}
          tripId={tripId}
          canEdit={canEdit}
          onEdit={onEdit}
          isSelected={selectedEntryId === entry.id}
          onSelect={() => onSelectEntry(entry.id === selectedEntryId ? null : entry.id)}
        />
      ))}
    </div>
  );
}
