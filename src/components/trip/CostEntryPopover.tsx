'use client';

import { Modal } from '@/components/ui/Modal';
import { formatCost, formatDate, formatDatetime } from '@/components/trip/EntryDetails';
import { ENTRY_LABELS, ENTRY_COLORS } from '@/lib/constants';
import type { CostRow } from '@/lib/cost-breakdown-utils';
import type { MemberWithUser } from '@/hooks/useMembers';
import type { Flight, Lodging, CarRental, Restaurant, Activity } from '@prisma/client';

type Props = {
  row: CostRow;
  members: MemberWithUser[];
  isOpen: boolean;
  onClose: () => void;
};

function getDateDisplay(row: CostRow): { label: string; value: string }[] | null {
  const results: { label: string; value: string }[] = [];

  switch (row.type) {
    case 'flight': {
      const f = row.entry as Flight;
      const dep = formatDatetime(f.departureDate);
      const arr = formatDatetime(f.arrivalDate);
      if (dep) results.push({ label: 'Departure', value: dep });
      if (arr) results.push({ label: 'Arrival', value: arr });
      break;
    }
    case 'lodging': {
      const l = row.entry as Lodging;
      const ci = formatDatetime(l.checkIn);
      const co = formatDatetime(l.checkOut);
      if (ci) results.push({ label: 'Check-in', value: ci });
      if (co) results.push({ label: 'Check-out', value: co });
      break;
    }
    case 'carRental': {
      const c = row.entry as CarRental;
      const pu = formatDatetime(c.pickupDate);
      const doff = formatDatetime(c.dropoffDate);
      if (pu) results.push({ label: 'Pickup', value: pu });
      if (doff) results.push({ label: 'Drop-off', value: doff });
      break;
    }
    case 'restaurant': {
      const r = row.entry as Restaurant;
      const d = formatDate(r.date);
      if (d) results.push({ label: 'Date', value: d });
      if (r.time) results.push({ label: 'Time', value: r.time });
      break;
    }
    case 'activity': {
      const a = row.entry as Activity;
      const d = formatDate(a.date);
      if (d) results.push({ label: 'Date', value: d });
      if (a.startTime) {
        const timeStr = a.endTime ? `${a.startTime} – ${a.endTime}` : a.startTime;
        results.push({ label: 'Time', value: timeStr });
      }
      break;
    }
  }

  return results.length > 0 ? results : null;
}

export function CostEntryPopover({ row, members, isOpen, onClose }: Props) {
  const perPerson = row.totalCost / row.attendeeIds.length;

  const attendeeNames = row.attendeeIds
    .map(id => members.find(m => m.userId === id)?.user.name)
    .filter(Boolean) as string[];

  const dateDisplay = getDateDisplay(row);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={row.name}>
      <div className="flex flex-col gap-3">
        <span
          className="inline-flex self-start items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: ENTRY_COLORS[row.type] }}
        >
          {ENTRY_LABELS[row.type]}
        </span>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-sm">
            <span className="text-sand-500">Total Cost</span>
            <span className="font-semibold text-sand-800">{formatCost(row.totalCost)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-sand-500">Per Person</span>
            <span className="font-semibold text-ocean-700">{formatCost(perPerson)}</span>
          </div>
        </div>

        {dateDisplay && (
          <div className="flex flex-col gap-1 text-sm">
            {dateDisplay.map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-sand-500">{label}</span>
                <span className="text-sand-700">{value}</span>
              </div>
            ))}
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-sand-500 uppercase tracking-wider mb-1.5">
            Attendees ({attendeeNames.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {attendeeNames.map((name, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-ocean-50 text-ocean-700"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
