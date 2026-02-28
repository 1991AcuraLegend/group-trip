import type { Flight, Lodging, CarRental, Restaurant, Activity } from '@prisma/client';
import type { EntryType } from '@/types';
import type { EntriesData } from '@/hooks/useEntries';
import type { MemberWithUser } from '@/hooks/useMembers';
import { getEntryName, getEntryDate } from '@/lib/entry-helpers';

export type CostRow = {
  id: string;
  type: EntryType;
  name: string;
  totalCost: number;
  date: Date | null;
  attendeeIds: string[];
  entry: Flight | Lodging | CarRental | Restaurant | Activity;
};

export type CostGrid = {
  rows: CostRow[];
  memberIds: string[];
  memberNames: Record<string, string>;
  totals: Record<string, number>;
};

export function buildCostGrid(entries: EntriesData, members: MemberWithUser[]): CostGrid {
  const allMemberIds = members.map(m => m.userId);

  // 1. Flatten all entry types into CostRow[]
  const rows: CostRow[] = [];

  const typeMap: { key: keyof EntriesData; type: EntryType }[] = [
    { key: 'flights', type: 'flight' },
    { key: 'lodgings', type: 'lodging' },
    { key: 'carRentals', type: 'carRental' },
    { key: 'restaurants', type: 'restaurant' },
    { key: 'activities', type: 'activity' },
  ];

  for (const { key, type } of typeMap) {
    for (const entry of entries[key]) {
      const cost = (entry as { cost?: number | null }).cost;
      if (!cost || cost <= 0) continue;
      if ((entry as { isIdea?: boolean }).isIdea) continue;

      const rawAttendees = (entry as { attendeeIds?: string[] }).attendeeIds ?? [];
      const attendeeIds = rawAttendees.length > 0 ? rawAttendees : allMemberIds;

      rows.push({
        id: entry.id,
        type,
        name: getEntryName(type, entry),
        totalCost: cost,
        date: getEntryDate(type, entry),
        attendeeIds,
        entry,
      });
    }
  }

  // 2. Sort by date ascending, nulls last, then by type
  rows.sort((a, b) => {
    if (a.date && b.date) return a.date.getTime() - b.date.getTime();
    if (a.date && !b.date) return -1;
    if (!a.date && b.date) return 1;
    return a.type.localeCompare(b.type);
  });

  // 3. Build member columns — owner first, then alphabetical
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === 'OWNER') return -1;
    if (b.role === 'OWNER') return 1;
    return a.user.name.localeCompare(b.user.name);
  });
  const memberIds = sortedMembers.map(m => m.userId);
  const memberNames: Record<string, string> = {};
  for (const m of members) {
    memberNames[m.userId] = m.user.name;
  }

  // 4. Compute totals
  const totals: Record<string, number> = {};
  for (const id of memberIds) totals[id] = 0;

  for (const row of rows) {
    const share = row.totalCost / row.attendeeIds.length;
    for (const uid of row.attendeeIds) {
      if (totals[uid] !== undefined) {
        totals[uid] += share;
      }
    }
  }

  return { rows, memberIds, memberNames, totals };
}

export function getUserShare(row: CostRow, userId: string): number | null {
  if (!row.attendeeIds.includes(userId)) return null;
  return row.totalCost / row.attendeeIds.length;
}
