'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { TimelineItem } from '@/lib/timeline-utils';
import { CardBody } from '@/components/trip/EntryDetails';
import { ENTRY_LABELS } from '@/lib/constants';

type Props = {
  item: TimelineItem;
  anchorRect: DOMRect;
  color: string;
  onClose: () => void;
};

export function TimelinePopover({ item, anchorRect, color, onClose }: Props) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    function onMouseDown(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [onClose]);

  // Close on scroll of any ancestor
  useEffect(() => {
    function onScroll() {
      onClose();
    }
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [onClose]);

  // Position the popover adjacent to the clicked bar
  const POPOVER_WIDTH = 280;
  const MARGIN = 8;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;

  let left: number;
  // Prefer right side, fall back to left
  if (anchorRect.right + POPOVER_WIDTH + MARGIN <= viewportWidth) {
    left = anchorRect.right + MARGIN;
  } else {
    left = Math.max(MARGIN, anchorRect.left - POPOVER_WIDTH - MARGIN);
  }
  const top = Math.min(
    anchorRect.top,
    (typeof window !== 'undefined' ? window.innerHeight : 800) - 320,
  );

  // On mobile (width < 640) render as bottom sheet via fixed positioning
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  const content = (
    <div
      ref={popoverRef}
      className={
        isMobile
          ? 'fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-white shadow-xl border-t border-sand-200 p-4 pb-safe'
          : 'fixed z-50 w-[280px] rounded-lg bg-white shadow-xl border border-sand-200 p-4'
      }
      style={
        isMobile
          ? undefined
          : { top: Math.max(MARGIN, top), left }
      }
      role="dialog"
      aria-label={`${ENTRY_LABELS[item.type]} details`}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
          style={{ backgroundColor: color + '20', color }}
        >
          {ENTRY_LABELS[item.type]}
        </span>
        <button
          onClick={onClose}
          className="text-sand-400 hover:text-sand-700 transition-colors p-1 rounded"
          aria-label="Close"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex flex-col gap-1">
        <CardBody type={item.type} entry={item.originalEntry} />
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
}
