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
  visible?: boolean;
};

export default function TripMap({ entries, onPinClick, visible }: Props) {
  return <MapContent entries={entries} onPinClick={onPinClick} visible={visible} />;
}
