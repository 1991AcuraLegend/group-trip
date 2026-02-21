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
  onEdit: (entry: Entry) => void;
};

export function EntryList({ entries, type, tripId, onEdit }: Props) {
  if (entries.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-sand-400">
        No {ENTRY_LABELS[type].toLowerCase()} added yet
      </div>
    );
  }

  const sorted = [...entries].sort(
    (a, b) => getEntryDate(type, a).getTime() - getEntryDate(type, b).getTime()
  );

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((entry) => (
        <EntryCard
          key={entry.id}
          entry={entry}
          type={type}
          tripId={tripId}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
