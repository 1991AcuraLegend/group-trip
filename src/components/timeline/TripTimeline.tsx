'use client';

import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useTrip } from '@/hooks/useTrips';
import { useEntries } from '@/hooks/useEntries';
import { useEntryColors } from '@/hooks/useEntryColors';
import {
  normalizeEntries,
  assignColumns,
  getTimelineRange,
  getDayMarkers,
  getHourLabels,
  getItemTop,
  PIXELS_PER_HOUR,
  TIME_GUTTER_WIDTH,
  type TimelineItem,
} from '@/lib/timeline-utils';
import { TimelineBar } from '@/components/timeline/TimelineBar';
import { TimelinePopover } from '@/components/timeline/TimelinePopover';
import { TripHeader } from '@/components/trip/TripHeader';

type Props = {
  tripId: string;
};

export function TripTimeline({ tripId }: Props) {
  const { data: trip, isLoading: tripLoading } = useTrip(tripId);
  const { data: entries, isLoading: entriesLoading } = useEntries(tripId);
  const entryColors = useEntryColors();

  const [selectedItem, setSelectedItem] = useState<{ item: TimelineItem; rect: DOMRect } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => {
    if (!entries) return [];
    const normalized = normalizeEntries(entries);
    return assignColumns(normalized);
  }, [entries]);

  const range = useMemo(() => {
    if (!trip) return null;
    return getTimelineRange(trip, items);
  }, [trip, items]);

  const dayMarkers = useMemo(() => (range ? getDayMarkers(range) : []), [range]);
  const hourLabels = useMemo(() => (range ? getHourLabels(range) : []), [range]);

  // Auto-scroll to first entry on mount
  useEffect(() => {
    if (!range || items.length === 0 || !scrollRef.current) return;
    const firstItem = items.reduce((a, b) => (a.startTime < b.startTime ? a : b));
    const offsetTop = getItemTop(firstItem.startTime, range.startTime);
    const scrollTop = Math.max(0, offsetTop - 80);
    scrollRef.current.scrollTop = scrollTop;
  }, [range, items]);

  const handleBarClick = useCallback((item: TimelineItem, rect: DOMRect) => {
    setSelectedItem((prev) =>
      prev?.item.id === item.id ? null : { item, rect },
    );
  }, []);

  const handlePopoverClose = useCallback(() => {
    setSelectedItem(null);
  }, []);

  if (tripLoading || entriesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-ocean-200 border-t-ocean-600" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex items-center justify-center h-screen text-sand-500">
        Trip not found.
      </div>
    );
  }

  const memberCount = trip.members?.length ?? 0;
  const totalHeightPx = range ? range.totalHours * PIXELS_PER_HOUR : 0;

  const hasEntries = items.length > 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TripHeader trip={trip} memberCount={memberCount} entryCount={items.length} />

      {/* Secondary nav */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-sand-200 bg-white text-sm shrink-0">
        <Link
          href={`/trips/${tripId}`}
          className="text-sand-500 hover:text-ocean-600 transition-colors"
        >
          ← Back to trip
        </Link>
        <span className="text-sand-300">|</span>
        <span className="text-ocean-700 font-medium">Timeline</span>
      </div>

      {!hasEntries ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-2 text-sand-500">
          <p className="text-lg font-medium">No entries yet</p>
          <p className="text-sm">Add flights, lodging, and activities to see them on the timeline.</p>
          <Link
            href={`/trips/${tripId}`}
            className="mt-2 text-sm text-ocean-600 hover:underline"
          >
            Go to trip →
          </Link>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto relative"
        >
          {/* Timeline canvas */}
          <div
            className="relative"
            style={{ height: totalHeightPx + 80, minWidth: 320 }}
          >
            {/* Hour labels in the gutter */}
            {hourLabels.map(({ label, top }) => (
              <div
                key={`hour-${label}-${top}`}
                className="absolute text-[10px] text-sand-400 select-none"
                style={{
                  top: top - 7,
                  left: 0,
                  width: TIME_GUTTER_WIDTH - 4,
                  textAlign: 'right',
                }}
              >
                {label}
              </div>
            ))}

            {/* Horizontal hour lines */}
            {hourLabels.map(({ top }, i) => (
              <div
                key={`hline-${i}`}
                className="absolute border-t border-sand-100"
                style={{ top, left: TIME_GUTTER_WIDTH, right: 0 }}
              />
            ))}

            {/* Day markers */}
            {range && dayMarkers.map((day) => {
              const top = getItemTop(day, range.startTime);
              const label = day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              return (
                <div key={day.toISOString()} className="absolute" style={{ top, left: 0, right: 0 }}>
                  <div
                    className="absolute border-t-2 border-sand-300"
                    style={{ left: TIME_GUTTER_WIDTH, right: 0 }}
                  />
                  <div
                    className="absolute text-[10px] font-semibold text-sand-500 bg-white px-1 leading-none select-none"
                    style={{ left: TIME_GUTTER_WIDTH + 4, top: 2 }}
                  >
                    {label}
                  </div>
                </div>
              );
            })}

            {/* Entry bars */}
            {range && items.map((item) => (
              <TimelineBar
                key={item.id}
                item={item}
                rangeStart={range.startTime}
                color={entryColors[item.type]}
                gutterWidth={TIME_GUTTER_WIDTH}
                onClick={handleBarClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Popover */}
      {selectedItem && (
        <TimelinePopover
          item={selectedItem.item}
          anchorRect={selectedItem.rect}
          color={entryColors[selectedItem.item.type]}
          onClose={handlePopoverClose}
        />
      )}
    </div>
  );
}
