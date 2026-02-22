'use client';

import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useTrip } from '@/hooks/useTrips';
import { useEntries } from '@/hooks/useEntries';
import { useEntryColors } from '@/hooks/useEntryColors';
import {
  normalizeEntries,
  assignColumns,
  assignDayColumns,
  getTimelineRange,
  getDayMarkers,
  getHourLabels,
  itemOverlapsDay,
  PIXELS_PER_HOUR,
  type TimelineItem,
} from '@/lib/timeline-utils';
import { TimelineBar } from '@/components/timeline/TimelineBar';
import { TimelinePopover } from '@/components/timeline/TimelinePopover';
import { TripHeader } from '@/components/trip/TripHeader';

const COLUMN_WIDTH = 280; // px
const COLUMN_GAP = 12; // px
const HOUR_LABEL_WIDTH = 36; // px - width reserved for hour labels on the left

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
  const hourLabels = useMemo(() => getHourLabels(), []);

  // Auto-scroll to first entry on mount
  useEffect(() => {
    if (!range || items.length === 0 || !scrollRef.current) return;
    // Find the first and last day with entries
    let firstDay: Date | null = null;
    for (const day of dayMarkers) {
      const itemsOnDay = items.filter(
        (item) =>
          new Date(item.startTime).toDateString() ===
          new Date(day).toDateString()
      );
      if (itemsOnDay.length > 0) {
        firstDay = day;
        break;
      }
    }
    if (firstDay) {
      const dayIndex = dayMarkers.findIndex(
        (d) => new Date(d).toDateString() === new Date(firstDay).toDateString()
      );
      const scrollLeft = Math.max(0, dayIndex * (COLUMN_WIDTH + COLUMN_GAP) - COLUMN_GAP);
      scrollRef.current.scrollLeft = scrollLeft;
    }
  }, [range, items, dayMarkers]);

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
  const dailyHeightPx = 24 * PIXELS_PER_HOUR; // 24 hours per day
  const hasEntries = items.length > 0;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TripHeader trip={trip} memberCount={memberCount} entryCount={items.length} />

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
        <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-hidden bg-sand-50">
          {/* Multi-column timeline container */}
          <div className="inline-flex gap-3 p-4 h-full">
            {range && dayMarkers.map((day, dayIndex) => {
              const dateStr = new Date(day).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                timeZone: 'UTC',
              });

              // Filter items that overlap with this day
              const itemsForDay = items.filter((item) => itemOverlapsDay(item, day));

              return (
                <div
                  key={`day-${dayIndex}-${day.toISOString()}`}
                  className="flex flex-col h-full bg-white rounded-lg border border-sand-200 shadow-sm overflow-x-hidden"
                  style={{ width: COLUMN_WIDTH }}
                >
                  {/* Column header */}
                  <div className="px-3 py-2 border-b border-sand-200 bg-gradient-to-b from-sand-50 to-white shrink-0">
                    <div className="text-sm font-semibold text-ocean-700">
                      {dateStr}
                    </div>
                  </div>

                  {/* Column content - scrollable by time */}
                  <div
                    className="flex-1 relative overflow-y-auto overflow-x-hidden"
                  >
                    {/* Hour labels and lines */}
                    {hourLabels.map(({ label, top }, i) => (
                      <div key={`hour-${dayIndex}-${i}`} className="absolute" style={{ top }}>
                        <div className="text-[11px] text-sand-400 font-medium px-2 py-1 select-none">
                          {label}
                        </div>
                        <div
                          className="border-t border-sand-100 absolute"
                          style={{ left: 0, right: 0 }}
                        />
                      </div>
                    ))}

                    {/* Entry bars for this day */}
                    {itemsForDay.length > 0 ? (
                      <div className="relative" style={{ height: dailyHeightPx, marginLeft: HOUR_LABEL_WIDTH }}>
                        {/* Render all-day items first */}
                        {itemsForDay
                          .filter((item) => item.isAllDay)
                          .map((item, idx) => (
                            <TimelineBar
                              key={item.id}
                              item={item}
                              dayStart={day}
                              color={entryColors[item.type]}
                              isColumnLayout={true}
                              allDayIndex={idx}
                              onClick={handleBarClick}
                            />
                          ))}
                        {/* Then render timed items with per-day collision layout */}
                        {(() => {
                          const dayColMap = assignDayColumns(itemsForDay, day);
                          return itemsForDay
                            .filter((item) => !item.isAllDay)
                            .map((item) => {
                              const colInfo = dayColMap.get(item.id) ?? { column: 0, totalColumns: 1 };
                              return (
                                <TimelineBar
                                  key={item.id}
                                  item={item}
                                  dayStart={day}
                                  color={entryColors[item.type]}
                                  isColumnLayout={true}
                                  columnIndex={colInfo.column}
                                  totalColumnsInGroup={colInfo.totalColumns}
                                  onClick={handleBarClick}
                                />
                              );
                            });
                        })()}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-sand-300">
                        <span className="text-sm">No events</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
