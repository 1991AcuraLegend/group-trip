'use client';

import { useTheme } from '@/providers/ThemeProvider';
import type { EntryType } from '@/types';

const COASTAL_ENTRY_COLORS: Record<EntryType, string> = {
  flight:     '#3b8cf0', // ocean-500
  lodging:    '#2bb8a2', // seafoam-500
  carRental:  '#d4b57c', // sand-400
  restaurant: '#f97356', // coral-500
  activity:   '#60a8f8', // ocean-400
};

const Y2K_ENTRY_COLORS: Record<EntryType, string> = {
  flight:     '#00a8e8', // ocean-500
  lodging:    '#00d4aa', // seafoam-500
  carRental:  '#8e9baa', // sand-400
  restaurant: '#ff45a0', // coral-500
  activity:   '#1ac8ff', // ocean-400
};

export function useEntryColors(): Record<EntryType, string> {
  const { theme } = useTheme();
  return theme === 'y2k' ? Y2K_ENTRY_COLORS : COASTAL_ENTRY_COLORS;
}
