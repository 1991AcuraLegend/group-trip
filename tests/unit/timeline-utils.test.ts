import { describe, it, expect } from 'vitest';
import {
  normalizeEntries,
  assignColumns,
  getTimelineRange,
  getItemTop,
  getItemHeight,
  getItemTopInDay,
  getItemHeightInDay,
  assignDayColumns,
  itemOverlapsDay,
  getDayMarkers,
  getHourLabels,
  PIXELS_PER_HOUR,
  POINT_EVENT_HOURS,
  type TimelineItem,
  type TimelineRange,
} from '@/lib/timeline-utils';
import {
  makeFlight,
  makeLodging,
  makeCarRental,
  makeRestaurant,
  makeActivity,
  makeEntriesData,
  makeTrip,
} from '../fixtures';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Build a local-time Date at midnight of a calendar date (avoids UTC-shift issues)
const localDate = (year: number, month: number, day: number) =>
  new Date(year, month - 1, day, 0, 0, 0, 0);

// Build a local-time Date at a specific hour on March 1 2026
const t = (hour: number, minute = 0) => new Date(2026, 2, 1, hour, minute, 0, 0);

function makeItem(overrides: Partial<TimelineItem> = {}): TimelineItem {
  return {
    id: 'item-1',
    type: 'activity',
    name: 'Test Event',
    startTime: t(9),
    endTime: t(10),
    isPointEvent: false,
    isAllDay: false,
    column: 0,
    totalColumns: 1,
    originalEntry: makeActivity(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// normalizeEntries
// ---------------------------------------------------------------------------

describe('normalizeEntries', () => {
  describe('flights', () => {
    it('skips flight ideas with null dates', () => {
      const data = makeEntriesData({
        flights: [makeFlight({ departureDate: null, arrivalDate: null, isIdea: true })],
      });
      const items = normalizeEntries(data).filter((i) => i.type === 'flight');
      expect(items).toHaveLength(0);
    });

    it('includes a flight with both dates', () => {
      const data = makeEntriesData({ flights: [makeFlight()] });
      const items = normalizeEntries(data).filter((i) => i.type === 'flight');
      expect(items).toHaveLength(1);
    });

    it('sets isAllDay=false and isPointEvent=false for flights', () => {
      const data = makeEntriesData({ flights: [makeFlight()] });
      const item = normalizeEntries(data).find((i) => i.type === 'flight')!;
      expect(item.isAllDay).toBe(false);
      expect(item.isPointEvent).toBe(false);
    });

    it('builds the correct name: "airline flightNumber"', () => {
      const data = makeEntriesData({ flights: [makeFlight({ airline: 'United', flightNumber: 'UA100' })] });
      const item = normalizeEntries(data).find((i) => i.type === 'flight')!;
      expect(item.name).toBe('United UA100');
    });
  });

  describe('lodgings', () => {
    it('skips lodging ideas with null dates', () => {
      const data = makeEntriesData({ lodgings: [makeLodging({ checkIn: null, checkOut: null })] });
      expect(normalizeEntries(data).filter((i) => i.type === 'lodging')).toHaveLength(0);
    });

    it('includes lodging with both dates', () => {
      const data = makeEntriesData({ lodgings: [makeLodging()] });
      expect(normalizeEntries(data).filter((i) => i.type === 'lodging')).toHaveLength(1);
    });

    it('sets isAllDay=true for lodging', () => {
      const data = makeEntriesData({ lodgings: [makeLodging()] });
      const item = normalizeEntries(data).find((i) => i.type === 'lodging')!;
      expect(item.isAllDay).toBe(true);
    });
  });

  describe('carRentals', () => {
    it('skips carRental ideas with null dates', () => {
      const data = makeEntriesData({ carRentals: [makeCarRental({ pickupDate: null, dropoffDate: null })] });
      expect(normalizeEntries(data).filter((i) => i.type === 'carRental')).toHaveLength(0);
    });

    it('sets isAllDay=true for carRental', () => {
      const data = makeEntriesData({ carRentals: [makeCarRental()] });
      const item = normalizeEntries(data).find((i) => i.type === 'carRental')!;
      expect(item.isAllDay).toBe(true);
    });
  });

  describe('restaurants', () => {
    it('skips restaurant ideas with null date', () => {
      const data = makeEntriesData({ restaurants: [makeRestaurant({ date: null })] });
      expect(normalizeEntries(data).filter((i) => i.type === 'restaurant')).toHaveLength(0);
    });

    it('sets isAllDay=false and isPointEvent=true when time is provided', () => {
      const data = makeEntriesData({ restaurants: [makeRestaurant({ time: '7:00 PM' })] });
      const item = normalizeEntries(data).find((i) => i.type === 'restaurant')!;
      expect(item.isAllDay).toBe(false);
      expect(item.isPointEvent).toBe(true);
    });

    it('sets isAllDay=true when time is null', () => {
      const data = makeEntriesData({ restaurants: [makeRestaurant({ time: null })] });
      const item = normalizeEntries(data).find((i) => i.type === 'restaurant')!;
      expect(item.isAllDay).toBe(true);
    });

    it('sets isAllDay=true when time is empty string', () => {
      const data = makeEntriesData({ restaurants: [makeRestaurant({ time: '' })] });
      const item = normalizeEntries(data).find((i) => i.type === 'restaurant')!;
      expect(item.isAllDay).toBe(true);
    });

    it('parses "7:00 PM" to hour 19', () => {
      const restaurant = makeRestaurant({ date: new Date('2026-03-03T00:00:00.000Z'), time: '7:00 PM' });
      const data = makeEntriesData({ restaurants: [restaurant] });
      const item = normalizeEntries(data).find((i) => i.type === 'restaurant')!;
      expect(item.startTime.getHours()).toBe(19);
    });

    it('parses "19:30" to hour 19 minute 30', () => {
      const restaurant = makeRestaurant({ date: new Date('2026-03-03T00:00:00.000Z'), time: '19:30' });
      const data = makeEntriesData({ restaurants: [restaurant] });
      const item = normalizeEntries(data).find((i) => i.type === 'restaurant')!;
      expect(item.startTime.getHours()).toBe(19);
      expect(item.startTime.getMinutes()).toBe(30);
    });

    it('parses "7pm" (no space) to hour 19', () => {
      const restaurant = makeRestaurant({ date: new Date('2026-03-03T00:00:00.000Z'), time: '7pm' });
      const data = makeEntriesData({ restaurants: [restaurant] });
      const item = normalizeEntries(data).find((i) => i.type === 'restaurant')!;
      expect(item.startTime.getHours()).toBe(19);
    });

    it('falls back to noon for an unparseable time string', () => {
      const restaurant = makeRestaurant({ date: new Date('2026-03-03T00:00:00.000Z'), time: 'bad-time' });
      const data = makeEntriesData({ restaurants: [restaurant] });
      const item = normalizeEntries(data).find((i) => i.type === 'restaurant')!;
      expect(item.startTime.getHours()).toBe(12);
    });

    it('sets endTime exactly POINT_EVENT_HOURS after startTime', () => {
      const data = makeEntriesData({ restaurants: [makeRestaurant()] });
      const item = normalizeEntries(data).find((i) => i.type === 'restaurant')!;
      expect(item.endTime.getTime() - item.startTime.getTime()).toBe(POINT_EVENT_HOURS * 3600 * 1000);
    });
  });

  describe('activities', () => {
    it('skips activity ideas with null date', () => {
      const data = makeEntriesData({ activities: [makeActivity({ date: null })] });
      expect(normalizeEntries(data).filter((i) => i.type === 'activity')).toHaveLength(0);
    });

    it('sets isAllDay=false and isPointEvent=false when both times provided and endTime > startTime', () => {
      const data = makeEntriesData({ activities: [makeActivity({ startTime: '10:00 AM', endTime: '2:00 PM' })] });
      const item = normalizeEntries(data).find((i) => i.type === 'activity')!;
      expect(item.isAllDay).toBe(false);
      expect(item.isPointEvent).toBe(false);
    });

    it('sets isAllDay=true when startTime is null', () => {
      const data = makeEntriesData({ activities: [makeActivity({ startTime: null })] });
      const item = normalizeEntries(data).find((i) => i.type === 'activity')!;
      expect(item.isAllDay).toBe(true);
    });

    it('sets isAllDay=true when startTime is empty string', () => {
      const data = makeEntriesData({ activities: [makeActivity({ startTime: '' })] });
      const item = normalizeEntries(data).find((i) => i.type === 'activity')!;
      expect(item.isAllDay).toBe(true);
    });

    it('sets isPointEvent=true when endTime is absent', () => {
      const data = makeEntriesData({ activities: [makeActivity({ endTime: null })] });
      const item = normalizeEntries(data).find((i) => i.type === 'activity')!;
      expect(item.isPointEvent).toBe(true);
    });

    it('sets endTime one hour after startTime when endTime is absent', () => {
      const data = makeEntriesData({ activities: [makeActivity({ endTime: null })] });
      const item = normalizeEntries(data).find((i) => i.type === 'activity')!;
      expect(item.endTime.getTime() - item.startTime.getTime()).toBe(POINT_EVENT_HOURS * 3600 * 1000);
    });

    it('treats endTime <= startTime as a point event', () => {
      const data = makeEntriesData({
        activities: [makeActivity({ startTime: '3:00 PM', endTime: '2:00 PM' })],
      });
      const item = normalizeEntries(data).find((i) => i.type === 'activity')!;
      expect(item.isPointEvent).toBe(true);
    });

    it('parses "10:00 AM" to hour 10', () => {
      const activity = makeActivity({ date: new Date('2026-03-04T00:00:00.000Z'), startTime: '10:00 AM' });
      const data = makeEntriesData({ activities: [activity] });
      const item = normalizeEntries(data).find((i) => i.type === 'activity')!;
      expect(item.startTime.getHours()).toBe(10);
    });

    it('parses "12:00 AM" (midnight) to hour 0', () => {
      const activity = makeActivity({ date: new Date('2026-03-04T00:00:00.000Z'), startTime: '12:00 AM' });
      const data = makeEntriesData({ activities: [activity] });
      const item = normalizeEntries(data).find((i) => i.type === 'activity')!;
      expect(item.startTime.getHours()).toBe(0);
    });
  });

  it('returns an empty array when all entries are ideas', () => {
    const data = makeEntriesData({
      flights: [makeFlight({ departureDate: null, arrivalDate: null })],
      lodgings: [makeLodging({ checkIn: null, checkOut: null })],
      carRentals: [makeCarRental({ pickupDate: null, dropoffDate: null })],
      restaurants: [makeRestaurant({ date: null })],
      activities: [makeActivity({ date: null })],
    });
    expect(normalizeEntries(data)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// assignColumns
// ---------------------------------------------------------------------------

describe('assignColumns', () => {
  it('returns empty array for empty input', () => {
    expect(assignColumns([])).toEqual([]);
  });

  it('assigns column=0 and totalColumns=1 to a single item', () => {
    const item = makeItem({ id: 'a', startTime: t(9), endTime: t(10) });
    const [result] = assignColumns([item]);
    expect(result.column).toBe(0);
    expect(result.totalColumns).toBe(1);
  });

  it('non-overlapping items each get column=0 and totalColumns=1', () => {
    const a = makeItem({ id: 'a', startTime: t(9), endTime: t(10) });
    const b = makeItem({ id: 'b', startTime: t(11), endTime: t(12) });
    const result = assignColumns([a, b]);
    const rA = result.find((r) => r.id === 'a')!;
    const rB = result.find((r) => r.id === 'b')!;
    expect(rA.column).toBe(0);
    expect(rA.totalColumns).toBe(1);
    expect(rB.column).toBe(0);
    expect(rB.totalColumns).toBe(1);
  });

  it('overlapping pair gets separate columns with totalColumns=2', () => {
    const a = makeItem({ id: 'a', startTime: t(9), endTime: t(11) });
    const b = makeItem({ id: 'b', startTime: t(10), endTime: t(12) });
    const result = assignColumns([a, b]);
    const rA = result.find((r) => r.id === 'a')!;
    const rB = result.find((r) => r.id === 'b')!;
    expect(rA.column).toBe(0);
    expect(rB.column).toBe(1);
    expect(rA.totalColumns).toBe(2);
    expect(rB.totalColumns).toBe(2);
  });

  it('three-way overlap assigns columns 0, 1, 2 and totalColumns=3', () => {
    const a = makeItem({ id: 'a', startTime: t(9), endTime: t(12) });
    const b = makeItem({ id: 'b', startTime: t(10), endTime: t(12) });
    const c = makeItem({ id: 'c', startTime: t(11), endTime: t(12) });
    const result = assignColumns([a, b, c]);
    const cols = result.map((r) => r.column).sort((x, y) => x - y);
    expect(cols).toEqual([0, 1, 2]);
    expect(result.every((r) => r.totalColumns === 3)).toBe(true);
  });

  it('tie-breaking: longer-duration item gets the earlier column', () => {
    const shorter = makeItem({ id: 'shorter', startTime: t(9), endTime: t(10) });
    const longer = makeItem({ id: 'longer', startTime: t(9), endTime: t(12) });
    // Pass in reverse order; sorting must put longer first
    const result = assignColumns([shorter, longer]);
    const rLonger = result.find((r) => r.id === 'longer')!;
    const rShorter = result.find((r) => r.id === 'shorter')!;
    expect(rLonger.column).toBe(0);
    expect(rShorter.column).toBe(1);
  });

  it('items touching at endpoint (endTime = next startTime) do not overlap', () => {
    const a = makeItem({ id: 'a', startTime: t(9), endTime: t(10) });
    const b = makeItem({ id: 'b', startTime: t(10), endTime: t(11) });
    const result = assignColumns([a, b]);
    // The sweep-line: columnEndTimes[0] = 10am; b.start = 10am >= 10am → reuse column 0
    expect(result.find((r) => r.id === 'b')!.column).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getTimelineRange
// ---------------------------------------------------------------------------

describe('getTimelineRange', () => {
  it('uses trip dates as base range', () => {
    const trip = makeTrip({
      startDate: new Date('2026-03-01T00:00:00.000Z'),
      endDate: new Date('2026-03-07T00:00:00.000Z'),
    });
    const range = getTimelineRange(trip, []);
    // startTime should be snapped to local midnight of March 1
    expect(range.startTime.getHours()).toBe(0);
    expect(range.startTime.getMinutes()).toBe(0);
    // endTime should be end of day March 7
    expect(range.endTime.getHours()).toBe(23);
  });

  it('totalHours for a 7-day trip is approximately 168', () => {
    const trip = makeTrip({
      startDate: new Date('2026-03-01T00:00:00.000Z'),
      endDate: new Date('2026-03-07T00:00:00.000Z'),
    });
    const { totalHours } = getTimelineRange(trip, []);
    expect(totalHours).toBeGreaterThan(167);
    expect(totalHours).toBeLessThanOrEqual(168);
  });

  it('falls back to today when trip has no dates and no items', () => {
    const trip = makeTrip({ startDate: null, endDate: null });
    const range = getTimelineRange(trip, []);
    const today = new Date();
    expect(range.startTime.getDate()).toBe(today.getDate());
    expect(range.totalHours).toBeGreaterThan(23);
    expect(range.totalHours).toBeLessThanOrEqual(24);
  });

  it('extends range backward when an item starts before trip startDate', () => {
    const trip = makeTrip({
      startDate: new Date('2026-03-01T00:00:00.000Z'),
      endDate: new Date('2026-03-07T00:00:00.000Z'),
    });
    const earlyItem = makeItem({
      startTime: localDate(2026, 2, 26), // Feb 26 — before trip start
      endTime: localDate(2026, 2, 27),
    });
    const range = getTimelineRange(trip, [earlyItem]);
    expect(range.startTime <= earlyItem.startTime).toBe(true);
  });

  it('extends range forward when an item ends after trip endDate', () => {
    const trip = makeTrip({
      startDate: new Date('2026-03-01T00:00:00.000Z'),
      endDate: new Date('2026-03-07T00:00:00.000Z'),
    });
    const lateItem = makeItem({
      startTime: localDate(2026, 3, 10), // March 10 — after trip end
      endTime: localDate(2026, 3, 11),
    });
    const range = getTimelineRange(trip, [lateItem]);
    expect(range.endTime >= lateItem.endTime).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getItemTop
// ---------------------------------------------------------------------------

describe('getItemTop', () => {
  it('returns 0 when item is at rangeStart', () => {
    const start = t(0);
    expect(getItemTop(start, start)).toBe(0);
  });

  it('returns 48px for 2 hours after rangeStart (PIXELS_PER_HOUR=24)', () => {
    expect(getItemTop(t(2), t(0))).toBe(48);
  });

  it('returns 12px for 30 minutes after rangeStart', () => {
    expect(getItemTop(t(0, 30), t(0))).toBe(12);
  });

  it('returns 9 * PIXELS_PER_HOUR for 9 hours', () => {
    expect(getItemTop(t(9), t(0))).toBe(9 * PIXELS_PER_HOUR);
  });
});

// ---------------------------------------------------------------------------
// getItemHeight
// ---------------------------------------------------------------------------

describe('getItemHeight', () => {
  it('returns 48px for a 2-hour item', () => {
    expect(getItemHeight(makeItem({ startTime: t(9), endTime: t(11) }))).toBe(48);
  });

  it('enforces the 24px minimum for a 30-minute item', () => {
    expect(getItemHeight(makeItem({ startTime: t(9), endTime: t(9, 30) }))).toBe(24);
  });

  it('returns 72px for a 3-hour item', () => {
    expect(getItemHeight(makeItem({ startTime: t(9), endTime: t(12) }))).toBe(72);
  });
});

// ---------------------------------------------------------------------------
// getItemTopInDay
// ---------------------------------------------------------------------------

describe('getItemTopInDay', () => {
  it('returns 0 for an all-day item regardless of startTime', () => {
    const item = makeItem({ isAllDay: true, startTime: t(9) });
    expect(getItemTopInDay(item, t(0))).toBe(0);
  });

  it('returns 9 * PIXELS_PER_HOUR for a timed item at 9am', () => {
    const dayStart = localDate(2026, 3, 1); // March 1 local midnight
    const item = makeItem({ isAllDay: false, startTime: new Date(2026, 2, 1, 9, 0) });
    expect(getItemTopInDay(item, dayStart)).toBe(9 * PIXELS_PER_HOUR);
  });

  it('returns 0 for a timed item at midnight (start of day)', () => {
    const dayStart = localDate(2026, 3, 1);
    const item = makeItem({ isAllDay: false, startTime: new Date(2026, 2, 1, 0, 0) });
    expect(getItemTopInDay(item, dayStart)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getItemHeightInDay
// ---------------------------------------------------------------------------

describe('getItemHeightInDay', () => {
  it('returns 32 for an all-day item', () => {
    expect(getItemHeightInDay(makeItem({ isAllDay: true }), t(0))).toBe(32);
  });

  it('returns 48px for a 2-hour timed item within the day', () => {
    const dayStart = localDate(2026, 3, 1);
    const item = makeItem({
      isAllDay: false,
      startTime: new Date(2026, 2, 1, 9, 0),
      endTime: new Date(2026, 2, 1, 11, 0),
    });
    expect(getItemHeightInDay(item, dayStart)).toBe(48);
  });

  it('clamps the height when an item starts before this day (endTime is within day)', () => {
    // Item: Feb 28 10pm → March 1 2am. Only 2am - midnight = 2 hours of March 1 visible.
    const dayStart = localDate(2026, 3, 1);
    const item = makeItem({
      isAllDay: false,
      startTime: new Date(2026, 1, 28, 22, 0), // Feb 28 10pm
      endTime: new Date(2026, 2, 1, 2, 0),      // March 1 2am
    });
    expect(getItemHeightInDay(item, dayStart)).toBe(48); // 2 hours * 24px
  });

  it('enforces 24px minimum', () => {
    const dayStart = localDate(2026, 3, 1);
    const item = makeItem({
      isAllDay: false,
      startTime: new Date(2026, 2, 1, 9, 0),
      endTime: new Date(2026, 2, 1, 9, 30), // 30 min → 12px → clamped to 24
    });
    expect(getItemHeightInDay(item, dayStart)).toBe(24);
  });
});

// ---------------------------------------------------------------------------
// assignDayColumns
// ---------------------------------------------------------------------------

describe('assignDayColumns', () => {
  const dayStart = localDate(2026, 3, 1);

  it('returns an empty map for empty input', () => {
    expect(assignDayColumns([], dayStart).size).toBe(0);
  });

  it('excludes all-day items', () => {
    const item = makeItem({ id: 'a', isAllDay: true, startTime: t(9), endTime: t(11) });
    expect(assignDayColumns([item], dayStart).size).toBe(0);
  });

  it('excludes items not on this day', () => {
    const item = makeItem({
      id: 'a',
      isAllDay: false,
      startTime: new Date(2026, 2, 2, 9, 0), // March 2
      endTime: new Date(2026, 2, 2, 10, 0),
    });
    expect(assignDayColumns([item], dayStart).size).toBe(0);
  });

  it('assigns column=0 and totalColumns=1 for a single timed item', () => {
    const item = makeItem({
      id: 'a',
      isAllDay: false,
      startTime: new Date(2026, 2, 1, 9, 0),
      endTime: new Date(2026, 2, 1, 10, 0),
    });
    const result = assignDayColumns([item], dayStart);
    expect(result.get('a')).toEqual({ column: 0, totalColumns: 1 });
  });

  it('non-overlapping timed items each get column=0, totalColumns=1', () => {
    const a = makeItem({ id: 'a', isAllDay: false, startTime: new Date(2026, 2, 1, 9, 0), endTime: new Date(2026, 2, 1, 10, 0) });
    const b = makeItem({ id: 'b', isAllDay: false, startTime: new Date(2026, 2, 1, 11, 0), endTime: new Date(2026, 2, 1, 12, 0) });
    const result = assignDayColumns([a, b], dayStart);
    expect(result.get('a')).toEqual({ column: 0, totalColumns: 1 });
    expect(result.get('b')).toEqual({ column: 0, totalColumns: 1 });
  });

  it('overlapping timed items get separate columns and totalColumns=2', () => {
    const a = makeItem({ id: 'a', isAllDay: false, startTime: new Date(2026, 2, 1, 9, 0), endTime: new Date(2026, 2, 1, 11, 0) });
    const b = makeItem({ id: 'b', isAllDay: false, startTime: new Date(2026, 2, 1, 10, 0), endTime: new Date(2026, 2, 1, 12, 0) });
    const result = assignDayColumns([a, b], dayStart);
    expect(result.get('a')?.column).toBe(0);
    expect(result.get('b')?.column).toBe(1);
    expect(result.get('a')?.totalColumns).toBe(2);
    expect(result.get('b')?.totalColumns).toBe(2);
  });

  it('clips items to day boundaries for overlap detection', () => {
    // Item spans from day before into this day; should still appear
    const item = makeItem({
      id: 'a',
      isAllDay: false,
      startTime: new Date(2026, 1, 28, 22, 0), // Feb 28 10pm
      endTime: new Date(2026, 2, 1, 2, 0),      // March 1 2am
    });
    const result = assignDayColumns([item], dayStart);
    expect(result.has('a')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// itemOverlapsDay
// ---------------------------------------------------------------------------

describe('itemOverlapsDay', () => {
  const dayStart = localDate(2026, 3, 1); // March 1

  it('item entirely within the day overlaps', () => {
    const item = makeItem({
      startTime: new Date(2026, 2, 1, 9, 0),
      endTime: new Date(2026, 2, 1, 10, 0),
    });
    expect(itemOverlapsDay(item, dayStart)).toBe(true);
  });

  it('item entirely before the day does not overlap', () => {
    const item = makeItem({
      startTime: new Date(2026, 1, 28, 9, 0),  // Feb 28
      endTime: new Date(2026, 1, 28, 10, 0),
    });
    expect(itemOverlapsDay(item, dayStart)).toBe(false);
  });

  it('item entirely after the day does not overlap', () => {
    const item = makeItem({
      startTime: new Date(2026, 2, 2, 9, 0),  // March 2
      endTime: new Date(2026, 2, 2, 10, 0),
    });
    expect(itemOverlapsDay(item, dayStart)).toBe(false);
  });

  it('item spanning from previous day into this day overlaps', () => {
    const item = makeItem({
      startTime: new Date(2026, 1, 28, 22, 0), // Feb 28 10pm
      endTime: new Date(2026, 2, 1, 2, 0),      // March 1 2am
    });
    expect(itemOverlapsDay(item, dayStart)).toBe(true);
  });

  it('item spanning from this day into next day overlaps', () => {
    const item = makeItem({
      startTime: new Date(2026, 2, 1, 22, 0), // March 1 10pm
      endTime: new Date(2026, 2, 2, 2, 0),     // March 2 2am
    });
    expect(itemOverlapsDay(item, dayStart)).toBe(true);
  });

  it('item ending exactly at day midnight does not overlap (strict >)', () => {
    const dayMidnight = new Date(2026, 2, 1, 0, 0, 0, 0);
    const item = makeItem({
      startTime: new Date(2026, 1, 28, 22, 0), // Feb 28 10pm
      endTime: dayMidnight,                      // exactly midnight — endTime > midnight is false
    });
    expect(itemOverlapsDay(item, dayStart)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getDayMarkers
// ---------------------------------------------------------------------------

describe('getDayMarkers', () => {
  it('returns one marker for a single-day range', () => {
    const range: TimelineRange = {
      startTime: localDate(2026, 3, 1),
      endTime: new Date(2026, 2, 1, 23, 59, 59, 999),
      totalHours: 23.999,
    };
    expect(getDayMarkers(range)).toHaveLength(1);
  });

  it('returns three markers for a three-day range', () => {
    const range: TimelineRange = {
      startTime: localDate(2026, 3, 1),
      endTime: new Date(2026, 2, 3, 23, 59, 59, 999),
      totalHours: 71.999,
    };
    const markers = getDayMarkers(range);
    expect(markers).toHaveLength(3);
  });

  it('all markers are at midnight (hour=0, minute=0)', () => {
    const range: TimelineRange = {
      startTime: localDate(2026, 3, 1),
      endTime: new Date(2026, 2, 3, 23, 59, 59, 999),
      totalHours: 71.999,
    };
    for (const d of getDayMarkers(range)) {
      expect(d.getHours()).toBe(0);
      expect(d.getMinutes()).toBe(0);
      expect(d.getSeconds()).toBe(0);
    }
  });

  it('consecutive markers are exactly one day apart', () => {
    const range: TimelineRange = {
      startTime: localDate(2026, 3, 1),
      endTime: new Date(2026, 2, 4, 23, 59, 59, 999),
      totalHours: 95.999,
    };
    const markers = getDayMarkers(range);
    for (let i = 1; i < markers.length; i++) {
      const diff = markers[i].getTime() - markers[i - 1].getTime();
      expect(diff).toBe(24 * 3600 * 1000);
    }
  });
});

// ---------------------------------------------------------------------------
// getHourLabels
// ---------------------------------------------------------------------------

describe('getHourLabels', () => {
  it('returns exactly 23 labels (hour 0 is skipped)', () => {
    expect(getHourLabels()).toHaveLength(23);
  });

  it('first label is "1a" at top=24', () => {
    expect(getHourLabels()[0]).toEqual({ label: '1a', top: 24 });
  });

  it('label at index 11 (h=12) is "12p" at top=288', () => {
    expect(getHourLabels()[11]).toEqual({ label: '12p', top: 288 });
  });

  it('label at index 12 (h=13) is "1p" at top=312', () => {
    expect(getHourLabels()[12]).toEqual({ label: '1p', top: 312 });
  });

  it('last label (h=23) is "11p" at top=552', () => {
    const labels = getHourLabels();
    expect(labels[22]).toEqual({ label: '11p', top: 552 });
  });

  it('top values increase by PIXELS_PER_HOUR for each label', () => {
    const labels = getHourLabels();
    for (let i = 1; i < labels.length; i++) {
      expect(labels[i].top - labels[i - 1].top).toBe(PIXELS_PER_HOUR);
    }
  });
});
