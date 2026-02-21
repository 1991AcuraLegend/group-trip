'use client';

import type { TimelineItem } from '@/lib/timeline-utils';
import { getItemTopInDay, getItemHeightInDay } from '@/lib/timeline-utils';
import { ENTRY_LABELS } from '@/lib/constants';

type Props = {
  item: TimelineItem;
  dayStart: Date;
  color: string;
  isColumnLayout?: boolean;
  allDayIndex?: number; // Position among all-day items for this day
  onClick: (item: TimelineItem, rect: DOMRect) => void;
};

export function TimelineBar({ item, dayStart, color, isColumnLayout = false, allDayIndex = 0, onClick }: Props) {
  const top = item.isAllDay ? allDayIndex * 36 : getItemTopInDay(item, dayStart);
  const height = getItemHeightInDay(item, dayStart);

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    onClick(item, rect);
  }

  // In column layout, bars span the full width
  if (isColumnLayout) {
    // All-day items render more compactly at the top
    if (item.isAllDay) {
      return (
        <button
          onClick={handleClick}
          className="absolute text-left focus:outline-none focus:ring-2 focus:ring-offset-1 group w-full"
          style={{
            top,
            height: Math.max(height, 28),
            left: 0,
            right: 0,
          }}
          aria-label={`${ENTRY_LABELS[item.type]}: ${item.name}`}
        >
          <div
            className="h-full w-full rounded overflow-hidden flex flex-col justify-start px-3 py-1 transition-opacity group-hover:opacity-90 mx-2"
            style={{
              backgroundColor: color + '26',
              borderLeft: `4px solid ${color}`,
            }}
          >
            <span className="text-xs font-semibold leading-tight truncate" style={{ color }}>
              {item.name}
            </span>
            <span className="text-xs leading-tight truncate" style={{ color, opacity: 0.75 }}>
              {ENTRY_LABELS[item.type]}
            </span>
          </div>
        </button>
      );
    }

    return (
      <button
        onClick={handleClick}
        className="absolute text-left focus:outline-none focus:ring-2 focus:ring-offset-1 group w-full"
        style={{
          top,
          height: Math.max(height, 36),
          left: 0,
          right: 0,
        }}
        aria-label={`${ENTRY_LABELS[item.type]}: ${item.name}`}
      >
        <div
          className="h-full w-full rounded overflow-hidden flex flex-col justify-start px-3 py-2 transition-opacity group-hover:opacity-90 mx-2"
          style={{
            backgroundColor: color + '26',
            borderLeft: `4px solid ${color}`,
          }}
        >
          <span className="text-sm font-semibold leading-tight truncate" style={{ color }}>
            {item.name}
          </span>
          {height >= 50 && (
            <span className="text-xs leading-tight truncate mt-1" style={{ color, opacity: 0.75 }}>
              {ENTRY_LABELS[item.type]}
              {item.isPointEvent && <span className="ml-1">·</span>}
            </span>
          )}
        </div>
      </button>
    );
  }

  // Legacy layout for multi-column positioning (if needed elsewhere)
  const colWidth = `calc((100% - 56px) / ${item.totalColumns})`;
  const left = `calc(56px + ${item.column} * (100% - 56px) / ${item.totalColumns})`;

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
          backgroundColor: color + '26',
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
