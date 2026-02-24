import { describe, it, expect } from 'vitest';
import { entryRegistry, ENTRY_TYPES, convertDates } from '@/lib/entry-registry';
import type { EntryType } from '@/types';

describe('ENTRY_TYPES', () => {
  it('contains all five entry types', () => {
    expect(ENTRY_TYPES).toHaveLength(5);
    expect(ENTRY_TYPES).toContain('flight');
    expect(ENTRY_TYPES).toContain('lodging');
    expect(ENTRY_TYPES).toContain('carRental');
    expect(ENTRY_TYPES).toContain('restaurant');
    expect(ENTRY_TYPES).toContain('activity');
  });
});

describe('entryRegistry', () => {
  it('has an entry for every ENTRY_TYPE', () => {
    for (const type of ENTRY_TYPES) {
      expect(entryRegistry[type]).toBeDefined();
    }
  });

  it('flight has correct dateFields', () => {
    expect(entryRegistry.flight.dateFields).toEqual(['departureDate', 'arrivalDate']);
  });

  it('lodging has correct dateFields', () => {
    expect(entryRegistry.lodging.dateFields).toEqual(['checkIn', 'checkOut']);
  });

  it('carRental has correct dateFields', () => {
    expect(entryRegistry.carRental.dateFields).toEqual(['pickupDate', 'dropoffDate']);
  });

  it('restaurant has correct dateFields', () => {
    expect(entryRegistry.restaurant.dateFields).toEqual(['date']);
  });

  it('activity has correct dateFields', () => {
    expect(entryRegistry.activity.dateFields).toEqual(['date']);
  });

  it('each type has the correct pluralKey', () => {
    expect(entryRegistry.flight.pluralKey).toBe('flights');
    expect(entryRegistry.lodging.pluralKey).toBe('lodgings');
    expect(entryRegistry.carRental.pluralKey).toBe('carRentals');
    expect(entryRegistry.restaurant.pluralKey).toBe('restaurants');
    expect(entryRegistry.activity.pluralKey).toBe('activities');
  });

  it('each type has a createSchema with a parse method', () => {
    for (const type of ENTRY_TYPES) {
      expect(typeof entryRegistry[type].createSchema.parse).toBe('function');
    }
  });
});

describe('convertDates', () => {
  it('converts flight date string fields to Date objects', () => {
    const input = {
      departureDate: '2026-03-01T08:00:00.000Z',
      arrivalDate: '2026-03-01T11:00:00.000Z',
      airline: 'Delta',
    };
    const result = convertDates('flight', input);
    expect(result.departureDate).toBeInstanceOf(Date);
    expect(result.arrivalDate).toBeInstanceOf(Date);
    expect((result.departureDate as Date).toISOString()).toBe('2026-03-01T08:00:00.000Z');
  });

  it('leaves non-date fields untouched', () => {
    const input = {
      departureDate: '2026-03-01T08:00:00.000Z',
      arrivalDate: '2026-03-01T11:00:00.000Z',
      airline: 'Delta',
      notes: 'window seat',
    };
    const result = convertDates('flight', input);
    expect(result.airline).toBe('Delta');
    expect(result.notes).toBe('window seat');
  });

  it('converts lodging date string fields', () => {
    const input = { checkIn: '2026-03-01T00:00:00.000Z', checkOut: '2026-03-07T00:00:00.000Z' };
    const result = convertDates('lodging', input);
    expect(result.checkIn).toBeInstanceOf(Date);
    expect(result.checkOut).toBeInstanceOf(Date);
  });

  it('converts carRental date string fields', () => {
    const input = { pickupDate: '2026-03-01T00:00:00.000Z', dropoffDate: '2026-03-07T00:00:00.000Z' };
    const result = convertDates('carRental', input);
    expect(result.pickupDate).toBeInstanceOf(Date);
    expect(result.dropoffDate).toBeInstanceOf(Date);
  });

  it('converts restaurant date field only', () => {
    const input = { date: '2026-03-03T00:00:00.000Z', time: '7:00 PM' };
    const result = convertDates('restaurant', input);
    expect(result.date).toBeInstanceOf(Date);
    expect(result.time).toBe('7:00 PM');
  });

  it('converts activity date field only', () => {
    const input = { date: '2026-03-04T00:00:00.000Z', startTime: '10:00 AM' };
    const result = convertDates('activity', input);
    expect(result.date).toBeInstanceOf(Date);
    expect(result.startTime).toBe('10:00 AM');
  });

  it('skips fields that are already Date objects', () => {
    const date = new Date('2026-03-01T08:00:00.000Z');
    const input: Record<string, unknown> = { departureDate: date, arrivalDate: '2026-03-01T11:00:00.000Z' };
    const result = convertDates('flight', input);
    // departureDate is already a Date, not a string — convertDates only converts strings
    expect(result.departureDate).toBe(date);
  });

  it('does not mutate the original input object', () => {
    const input = { departureDate: '2026-03-01T08:00:00.000Z', arrivalDate: '2026-03-01T11:00:00.000Z' };
    convertDates('flight', input);
    expect(typeof input.departureDate).toBe('string');
  });

  it('handles a type with a single date field (restaurant)', () => {
    const input: Record<string, unknown> = { date: '2026-03-03T00:00:00.000Z', checkIn: '2026-03-01' };
    const result = convertDates('restaurant', input);
    // Only 'date' is in restaurant dateFields; 'checkIn' is not
    expect(result.date).toBeInstanceOf(Date);
    expect(result.checkIn).toBe('2026-03-01');
  });
});

describe('entryRegistry types coverage', () => {
  const ALL_TYPES: EntryType[] = ['flight', 'lodging', 'carRental', 'restaurant', 'activity'];

  it('every type in ENTRY_TYPES matches the expected list', () => {
    expect([...ENTRY_TYPES].sort()).toEqual([...ALL_TYPES].sort());
  });
});
