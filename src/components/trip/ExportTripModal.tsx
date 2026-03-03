'use client';

import { useState, useMemo } from 'react';
import type { Trip } from '@prisma/client';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useEntries } from '@/hooks/useEntries';
import { serializeTripForExport } from '@/lib/trip-export';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  tripId: string;
};

export function ExportTripModal({ isOpen, onClose, trip, tripId }: Props) {
  const { data: entries } = useEntries(tripId);
  const [copied, setCopied] = useState(false);

  const json = useMemo(() => {
    if (!entries) return '';
    return serializeTripForExport(trip, entries);
  }, [trip, entries]);

  async function handleCopy() {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Trip">
      {!entries ? (
        <p className="text-sm text-sand-500">Loading entries...</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-sand-600">
            Copy this JSON to import the trip elsewhere.
          </p>
          <textarea
            readOnly
            value={json}
            className="w-full h-64 rounded-lg border border-sand-300 bg-sand-50 p-3 text-xs font-mono text-sand-800 focus:outline-none resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button size="sm" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
