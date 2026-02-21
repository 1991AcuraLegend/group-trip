'use client';

import dynamic from 'next/dynamic';
import type { MappableEntry } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const MapContent = dynamic(() => import('./MapContent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  ),
});

type Props = {
  entries: MappableEntry[];
  onPinClick?: (entry: MappableEntry) => void;
  onSelectEntry?: (entryId: string) => void;
  visible?: boolean;
  selectedEntryId?: string | null;
};

export default function TripMap({ entries, onPinClick, onSelectEntry, visible, selectedEntryId }: Props) {
  const handlePinClick = (entry: MappableEntry) => {
    if (onSelectEntry) {
      onSelectEntry(entry.id);
    }
    onPinClick?.(entry);
  };

  return <MapContent entries={entries} onPinClick={handlePinClick} visible={visible} selectedEntryId={selectedEntryId} />;
}
