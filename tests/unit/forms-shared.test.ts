import { describe, it, expect } from 'vitest';
import { toDatetimeLocal, toDateInput, toISO } from '@/components/trip/forms/shared';

describe('toDatetimeLocal', () => {
  it('formats a Date to YYYY-MM-DDTHH:MM using local time', () => {
    // Construct using local time components so output is deterministic
    const d = new Date(2026, 2, 1, 9, 30); // local March 1, 2026 09:30
    expect(toDatetimeLocal(d)).toBe('2026-03-01T09:30');
  });

  it('pads single-digit month, day, hours and minutes', () => {
    const d = new Date(2026, 0, 5, 8, 5); // local Jan 5, 2026 08:05
    expect(toDatetimeLocal(d)).toBe('2026-01-05T08:05');
  });

  it('handles midnight correctly', () => {
    const d = new Date(2026, 5, 15, 0, 0); // local June 15 00:00
    expect(toDatetimeLocal(d)).toBe('2026-06-15T00:00');
  });

  it('returns empty string for null', () => {
    expect(toDatetimeLocal(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(toDatetimeLocal(undefined)).toBe('');
  });

  it('returns empty string for an invalid date string', () => {
    expect(toDatetimeLocal('not-a-date')).toBe('');
  });

  it('accepts a valid ISO string and produces the expected format', () => {
    const result = toDatetimeLocal('2026-06-15T14:30:00.000Z');
    // Output is timezone-dependent; verify shape only
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});

describe('toDateInput', () => {
  it('formats a UTC midnight Date to YYYY-MM-DD', () => {
    const d = new Date('2026-03-01T00:00:00.000Z');
    expect(toDateInput(d)).toBe('2026-03-01');
  });

  it('pads single-digit UTC month and day', () => {
    const d = new Date('2026-01-05T00:00:00.000Z');
    expect(toDateInput(d)).toBe('2026-01-05');
  });

  it('uses UTC methods so timezone does not shift the date', () => {
    // Even in timezones behind UTC this must return the UTC calendar date
    const d = new Date('2026-07-04T00:00:00.000Z');
    expect(toDateInput(d)).toBe('2026-07-04');
  });

  it('returns empty string for null', () => {
    expect(toDateInput(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(toDateInput(undefined)).toBe('');
  });

  it('returns empty string for an invalid date string', () => {
    expect(toDateInput('not-a-date')).toBe('');
  });
});

describe('toISO', () => {
  it('returns undefined for undefined', () => {
    expect(toISO(undefined)).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(toISO('')).toBeUndefined();
  });

  it('returns undefined for an invalid date string', () => {
    expect(toISO('not-a-date')).toBeUndefined();
  });

  it('converts a date-only string to a valid ISO string', () => {
    const result = toISO('2026-03-01');
    expect(result).toBeDefined();
    expect(result).toMatch(/^2026-03-01/);
  });

  it('converts a datetime-local string to a valid ISO string', () => {
    const result = toISO('2026-06-15T14:30');
    expect(result).toBeDefined();
    // Must be a full ISO 8601 UTC string
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('produced ISO string round-trips correctly', () => {
    const input = '2026-03-01T09:30';
    const iso = toISO(input)!;
    // The resulting Date must have the same year/month/day as the local input
    const d = new Date(iso);
    expect(d.getTime()).toBe(new Date(input).getTime());
  });
});
