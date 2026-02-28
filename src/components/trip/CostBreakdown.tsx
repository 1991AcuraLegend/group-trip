'use client';

import { useMemo, useState } from 'react';
import { useTrip } from '@/hooks/useTrips';
import { useEntries } from '@/hooks/useEntries';
import { useMembers } from '@/hooks/useMembers';
import { TripHeader } from './TripHeader';
import { CostEntryPopover } from './CostEntryPopover';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { buildCostGrid, getUserShare } from '@/lib/cost-breakdown-utils';
import type { CostRow } from '@/lib/cost-breakdown-utils';
import { formatCost } from '@/components/trip/EntryDetails';
import { ENTRY_COLORS } from '@/lib/constants';

type Props = { tripId: string };

export function CostBreakdown({ tripId }: Props) {
  const { data: trip, isLoading: tripLoading } = useTrip(tripId);
  const { data: entries, isLoading: entriesLoading } = useEntries(tripId);
  const { data: members, isLoading: membersLoading } = useMembers(tripId);
  const [selectedRow, setSelectedRow] = useState<CostRow | null>(null);

  const grid = useMemo(() => {
    if (!entries || !members) return null;
    return buildCostGrid(entries, members);
  }, [entries, members]);

  if (tripLoading || entriesLoading || membersLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Trip not found or you don&apos;t have access.</p>
      </div>
    );
  }

  const memberCount = trip.members?.length ?? 0;

  return (
    <div className="flex h-screen flex-col">
      <TripHeader trip={trip} memberCount={memberCount} />

      <div className="flex-1 overflow-auto p-4 lg:p-8">
        {!grid || grid.rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-sand-500">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="mt-2 text-lg font-medium">No costs to show</p>
            <p className="text-sm">Add costs to your plan entries to see the breakdown here.</p>
          </div>
        ) : (
          <div className="glass rounded-xl border border-sand-200 bg-white shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sand-50 border-b border-sand-200">
                  <th className="sticky left-0 z-10 bg-sand-50 px-4 py-3 text-left text-xs font-semibold text-sand-600 uppercase tracking-wider">
                    Entry
                  </th>
                  {grid.memberIds.map(uid => (
                    <th
                      key={uid}
                      className="px-3 py-3 text-right text-xs font-semibold text-sand-600 uppercase tracking-wider"
                    >
                      <span className="block max-w-[100px] truncate ml-auto">
                        {grid.memberNames[uid]}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.rows.map(row => (
                  <tr
                    key={row.id}
                    className="border-t border-sand-100 hover:bg-sand-50/50 transition-colors"
                  >
                    <td
                      className="sticky left-0 z-[5] bg-white px-4 py-2.5 font-medium text-sand-800 cursor-pointer hover:text-ocean-600 transition-colors whitespace-nowrap"
                      onClick={() => setSelectedRow(row)}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: ENTRY_COLORS[row.type] }}
                        />
                        {row.name}
                      </span>
                    </td>
                    {grid.memberIds.map(uid => {
                      const share = getUserShare(row, uid);
                      return (
                        <td
                          key={uid}
                          className="px-3 py-2.5 text-right tabular-nums text-sand-700"
                        >
                          {share != null ? formatCost(share) : ''}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-sand-300 bg-sand-50">
                  <td className="sticky left-0 z-[5] bg-sand-50 px-4 py-3 font-bold text-sand-800 uppercase text-xs tracking-wider">
                    Total
                  </td>
                  {grid.memberIds.map(uid => (
                    <td
                      key={uid}
                      className="px-3 py-3 text-right tabular-nums font-bold text-ocean-800"
                    >
                      {formatCost(grid.totals[uid]) || '$0.00'}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {selectedRow && members && (
        <CostEntryPopover
          row={selectedRow}
          members={members}
          isOpen={!!selectedRow}
          onClose={() => setSelectedRow(null)}
        />
      )}
    </div>
  );
}
