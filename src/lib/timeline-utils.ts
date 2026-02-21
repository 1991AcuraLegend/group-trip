import type { Flight, Lodging, CarRental, Restaurant, Activity, Trip } from '@prisma/client';
import type { EntryType } from '@/types';
import type { EntriesData } from '@/hooks/useEntries';
import { getEntryName } from '@/lib/entry-helpers';

export const PIXELS_PER_HOUR = 24;
export const POINT_EVENT_HOURS = 1;
export const TIME_GUTTER_WIDTH = 56; // px

export type TimelineItem = {
  id: string;
  type: EntryType;
  name: string;
  startTime: Date;
  endTime: Date;
  isPointEvent: boolean;
  isAllDay: boolean;
  column: number;
  totalColumns: number;
  originalEntry: Flight | Lodging | CarRental | Restaurant | Activity;
};

// Parse a time string like "7:30 PM", "19:30", "7pm", "14:00" → { hours, minutes }
// Returns null if unparseable; caller falls back to noon.
function parseTimeString(time: string): { hours: number; minutes: number } | null {
  // Match optional leading h, colon, optional minutes, optional am/pm
  const match = time.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3]?.toLowerCase();
  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
}

// Build a Date combining a base date (date-only) with an optional time string.
// Falls back to the specified fallbackHour if time is missing or unparseable.
function combineDateAndTime(baseDate: Date, timeStr: string | null | undefined, fallbackHour: number): Date {
  // Dates are stored as UTC midnight in the DB. Use UTC components to build the
  // correct local date so timezones behind UTC don't shift the date back by one day.
  const d = new Date(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate(), 0, 0, 0, 0);
  if (timeStr) {
    const parsed = parseTimeString(timeStr);
    if (parsed) {
      d.setHours(parsed.hours, parsed.minutes, 0, 0);
      return d;
    }
  }
  d.setHours(fallbackHour, 0, 0, 0);
  return d;
}

export function normalizeEntries(entries: EntriesData): TimelineItem[] {
  const items: TimelineItem[] = [];

  for (const f of entries.flights) {
    const startTime = new Date(f.departureDate);
    const endTime = new Date(f.arrivalDate);
    items.push({
      id: f.id,
      type: 'flight',
      name: getEntryName('flight', f),
      startTime,
      endTime,
      isPointEvent: false,
      isAllDay: false,
      column: 0,
      totalColumns: 1,
      originalEntry: f,
    });
  }

  for (const l of entries.lodgings) {
    const startTime = new Date(l.checkIn);
    const endTime = new Date(l.checkOut);
    items.push({
      id: l.id,
      type: 'lodging',
      name: getEntryName('lodging', l),
      startTime,
      endTime,
      isPointEvent: false,
      isAllDay: true,
      column: 0,
      totalColumns: 1,
      originalEntry: l,
    });
  }

  for (const c of entries.carRentals) {
    const startTime = new Date(c.pickupDate);
    const endTime = new Date(c.dropoffDate);
    items.push({
      id: c.id,
      type: 'carRental',
      name: getEntryName('carRental', c),
      startTime,
      endTime,
      isPointEvent: false,
      isAllDay: true,
      column: 0,
      totalColumns: 1,
      originalEntry: c,
    });
  }

  for (const r of entries.restaurants) {
    // date field is midnight UTC from DB; time is a string
    const isAllDay = !r.time || r.time.trim() === '';
    const startTime = combineDateAndTime(new Date(r.date), r.time, 12);
    const endTime = new Date(startTime.getTime() + POINT_EVENT_HOURS * 3600 * 1000);
    items.push({
      id: r.id,
      type: 'restaurant',
      name: getEntryName('restaurant', r),
      startTime,
      endTime,
      isPointEvent: true,
      isAllDay,
      column: 0,
      totalColumns: 1,
      originalEntry: r,
    });
  }

  for (const a of entries.activities) {
    const isAllDay = !a.startTime || a.startTime.trim() === '';
    const startTime = combineDateAndTime(new Date(a.date), a.startTime, 0);
    let endTime: Date;
    let isPointEvent: boolean;
    if (a.endTime && a.endTime.trim() !== '') {
      endTime = combineDateAndTime(new Date(a.date), a.endTime, 1);
      // If endTime <= startTime (e.g. parse failure or same time), treat as point
      if (endTime <= startTime) {
        endTime = new Date(startTime.getTime() + POINT_EVENT_HOURS * 3600 * 1000);
        isPointEvent = true;
      } else {
        isPointEvent = false;
      }
    } else {
      endTime = new Date(startTime.getTime() + POINT_EVENT_HOURS * 3600 * 1000);
      isPointEvent = true;
    }
    items.push({
      id: a.id,
      type: 'activity',
      name: getEntryName('activity', a),
      startTime,
      endTime,
      isPointEvent,
      isAllDay,
      column: 0,
      totalColumns: 1,
      originalEntry: a,
    });
  }

  return items;
}

// Greedy sweep-line column assignment for overlapping entries.
// Sorts by startTime (ties broken by longer duration first), then assigns columns.
export function assignColumns(items: TimelineItem[]): TimelineItem[] {
  if (items.length === 0) return [];

  const sorted = [...items].sort((a, b) => {
    const dt = a.startTime.getTime() - b.startTime.getTime();
    if (dt !== 0) return dt;
    // Longer duration first
    const durA = a.endTime.getTime() - a.startTime.getTime();
    const durB = b.endTime.getTime() - b.startTime.getTime();
    return durB - durA;
  });

  // columnEndTimes[col] = earliest endTime we can place the next item in that column
  const columnEndTimes: number[] = [];

  for (const item of sorted) {
    const start = item.startTime.getTime();
    // Find first column where the previous item has ended
    let assigned = -1;
    for (let col = 0; col < columnEndTimes.length; col++) {
      if (columnEndTimes[col] <= start) {
        assigned = col;
        break;
      }
    }
    if (assigned === -1) {
      assigned = columnEndTimes.length;
      columnEndTimes.push(0);
    }
    columnEndTimes[assigned] = item.endTime.getTime();
    item.column = assigned;
  }

  const totalColumns = columnEndTimes.length;

  // Now determine totalColumns per overlap group using a sweep.
  // For each item, totalColumns = max column index of any item it overlaps + 1.
  // Re-sweep to find the actual group widths.
  for (const item of sorted) {
    let maxCol = item.column;
    for (const other of sorted) {
      if (other === item) continue;
      // Overlap check
      if (other.startTime < item.endTime && other.endTime > item.startTime) {
        if (other.column > maxCol) maxCol = other.column;
      }
    }
    item.totalColumns = maxCol + 1;
  }

  // Suppress unused variable warning
  void totalColumns;

  return sorted;
}

export type TimelineRange = {
  startTime: Date;
  endTime: Date;
  totalHours: number;
};

// Compute the display range for the timeline.
export function getTimelineRange(
  trip: Pick<Trip, 'startDate' | 'endDate'>,
  items: TimelineItem[],
): TimelineRange {
  let rangeStart: Date | null = null;
  let rangeEnd: Date | null = null;

  // Use trip dates as the base range
  if (trip.startDate) rangeStart = new Date(trip.startDate);
  if (trip.endDate) {
    rangeEnd = new Date(trip.endDate);
    // endDate is often midnight; push to end of that day
    rangeEnd.setHours(23, 59, 59, 999);
  }

  // Extend range to include all entries
  for (const item of items) {
    if (!rangeStart || item.startTime < rangeStart) rangeStart = new Date(item.startTime);
    if (!rangeEnd || item.endTime > rangeEnd) rangeEnd = new Date(item.endTime);
  }

  // Fallback: no dates at all
  if (!rangeStart || !rangeEnd) {
    const now = new Date();
    rangeStart = new Date(now);
    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd = new Date(now);
    rangeEnd.setHours(23, 59, 59, 999);
  }

  // Snap range to midnight boundaries for clean day markers
  const start = new Date(rangeStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(rangeEnd);
  // Push end to end of the day
  end.setHours(23, 59, 59, 999);

  const totalHours = (end.getTime() - start.getTime()) / 3600000;

  return { startTime: start, endTime: end, totalHours };
}

// Pixel offset from the top of the timeline container for a given time.
export function getItemTop(itemTime: Date, rangeStart: Date): number {
  const diffHours = (itemTime.getTime() - rangeStart.getTime()) / 3600000;
  return diffHours * PIXELS_PER_HOUR;
}

// Get the pixel offset within a 24-hour day column for an item.
// For all-day items, returns 0. For timed items, calculates position from midnight of that day.
export function getItemTopInDay(item: TimelineItem, dayStart: Date): number {
  if (item.isAllDay) {
    return 0;
  }
  // Calculate midnight of the starting day
  const dayMidnight = new Date(dayStart);
  dayMidnight.setHours(0, 0, 0, 0);
  return getItemTop(item.startTime, dayMidnight);
}

// Pixel height for a timeline item.
export function getItemHeight(item: TimelineItem): number {
  const durationHours = (item.endTime.getTime() - item.startTime.getTime()) / 3600000;
  return Math.max(durationHours * PIXELS_PER_HOUR, 24); // at least 24px tall
}

// Get the pixel height for an item within a single day column.
// For all-day items, returns a fixed height. For timed items, returns height relative to that day.
export function getItemHeightInDay(item: TimelineItem, dayStart: Date): number {
  if (item.isAllDay) {
    return 32; // Fixed height for all-day items
  }

  // For timed items, calculate how much of the item falls within this day
  const dayMidnight = new Date(dayStart);
  dayMidnight.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayMidnight);
  dayEnd.setHours(23, 59, 59, 999);

  // Clamp item to this day
  const itemStart = item.startTime >= dayMidnight ? item.startTime : dayMidnight;
  const itemEnd = item.endTime <= dayEnd ? item.endTime : dayEnd;

  const durationHours = (itemEnd.getTime() - itemStart.getTime()) / 3600000;
  return Math.max(durationHours * PIXELS_PER_HOUR, 24);
}

// Assign per-day columns for timed items within a specific day.
// Returns a Map from item.id to { column, totalColumns }.
export function assignDayColumns(
  items: TimelineItem[],
  dayStart: Date,
): Map<string, { column: number; totalColumns: number }> {
  const result = new Map<string, { column: number; totalColumns: number }>();

  const dayMidnight = new Date(dayStart);
  dayMidnight.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayMidnight);
  dayEnd.setHours(23, 59, 59, 999);

  // Only timed items (not all-day) that are visible on this day
  const timedItems = items.filter(
    (item) => !item.isAllDay && item.startTime <= dayEnd && item.endTime > dayMidnight,
  );

  if (timedItems.length === 0) return result;

  // Clip times to this day for overlap detection
  const clipped = timedItems.map((item) => ({
    id: item.id,
    start: Math.max(item.startTime.getTime(), dayMidnight.getTime()),
    end: Math.min(item.endTime.getTime(), dayEnd.getTime()),
  }));

  // Sort by start time, then longer duration first
  clipped.sort((a, b) => {
    const dt = a.start - b.start;
    if (dt !== 0) return dt;
    return (b.end - b.start) - (a.end - a.start);
  });

  // Greedy column assignment
  const columnEndTimes: number[] = [];
  const colFor = new Map<string, number>();

  for (const item of clipped) {
    let col = -1;
    for (let c = 0; c < columnEndTimes.length; c++) {
      if (columnEndTimes[c] <= item.start) {
        col = c;
        break;
      }
    }
    if (col === -1) {
      col = columnEndTimes.length;
      columnEndTimes.push(0);
    }
    columnEndTimes[col] = item.end;
    colFor.set(item.id, col);
  }

  // For each item, totalColumns = max column of all overlapping items + 1
  for (const item of clipped) {
    const itemCol = colFor.get(item.id)!;
    let maxCol = itemCol;
    for (const other of clipped) {
      if (other.id === item.id) continue;
      if (other.start < item.end && other.end > item.start) {
        const otherCol = colFor.get(other.id)!;
        if (otherCol > maxCol) maxCol = otherCol;
      }
    }
    result.set(item.id, { column: itemCol, totalColumns: maxCol + 1 });
  }

  return result;
}

// Check if an item overlaps with a specific day.
export function itemOverlapsDay(item: TimelineItem, dayStart: Date): boolean {
  const dayMidnight = new Date(dayStart);
  dayMidnight.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayMidnight);
  dayEnd.setHours(23, 59, 59, 999);

  // Item overlaps if it starts before day ends AND ends after or at day starts
  return item.startTime <= dayEnd && item.endTime > dayMidnight;
}

// Generate an array of Date objects, one per midnight boundary, within the range.
export function getDayMarkers(range: TimelineRange): Date[] {
  const days: Date[] = [];
  const d = new Date(range.startTime);
  d.setHours(0, 0, 0, 0);
  while (d <= range.endTime) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

// Generate hour labels for the time gutter (every hour within a single day).
export function getHourLabels(): { label: string; top: number }[] {
  const labels: { label: string; top: number }[] = [];
  // Generate labels for all 24 hours of a day
  for (let h = 0; h < 24; h++) {
    const label = h === 0 ? '' : h === 12 ? '12p' : h < 12 ? `${h}a` : `${h - 12}p`;
    if (label) {
      labels.push({ label, top: h * PIXELS_PER_HOUR });
    }
  }
  return labels;
}
