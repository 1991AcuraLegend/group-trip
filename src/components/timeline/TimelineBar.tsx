'use client';

import type { TimelineItem } from '@/lib/timeline-utils';
import { getItemTop, getItemHeight } from '@/lib/timeline-utils';
import { ENTRY_LABELS } from '@/lib/constants';

type Props = {
  item: TimelineItem;
  rangeStart: Date;
  color: string;
  gutterWidth: number;
  onClick: (item: TimelineItem, rect: DOMRect) => void;
};

export function TimelineBar({ item, rangeStart, color, gutterWidth, onClick }: Props) {
  const top = getItemTop(item.startTime, rangeStart);
  const height = getItemHeight(item);

  // Column positioning: each column takes equal share of the available width
  // We express as CSS custom properties so the parent can control total width
  const colWidth = `calc((100% - ${gutterWidth}px) / ${item.totalColumns})`;
  const left = `calc(${gutterWidth}px + ${item.column} * (100% - ${gutterWidth}px) / ${item.totalColumns})`;

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    onClick(item, rect);
  }

  return (
    <button
      onClick={handleClick}
      className="absolute text-left focus:outline-none focus:ring-2 focus:ring-offset-1 group"
      style={{
        top,
        height: Math.max(height, 28),
        left,
        width: colWidth,
        paddingLeft: 4,
        paddingRight: 4,
      }}
      aria-label={`${ENTRY_LABELS[item.type]}: ${item.name}`}
    >
      <div
        className="h-full w-full rounded overflow-hidden flex flex-col justify-start px-2 py-1 transition-opacity group-hover:opacity-90"
        style={{
          backgroundColor: color + '26', // ~15% opacity
          borderLeft: `3px solid ${color}`,
        }}
      >
        <span className="text-xs font-semibold leading-tight truncate" style={{ color }}>
          {item.name}
        </span>
        {height >= 40 && (
          <span className="text-[10px] leading-tight truncate" style={{ color, opacity: 0.75 }}>
            {ENTRY_LABELS[item.type]}
            {item.isPointEvent && <span className="ml-1">·</span>}
          </span>
        )}
      </div>
    </button>
  );
}
