'use client';

import { useEntryColors } from '@/hooks/useEntryColors';
import type { EntryType } from '@/types';

type Props = { type: Exclude<EntryType, 'flight'>; size?: number };

export function MapPin({ type, size = 16 }: Props) {
  const entryColors = useEntryColors();
  const color = entryColors[type];
  return (
    <svg width={size} height={size * 1.5} viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z"
        fill={color}
      />
      <circle cx="12" cy="12" r="5" fill="white" />
    </svg>
  );
}
