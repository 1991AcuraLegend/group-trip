import { describe, it, expect } from 'vitest';
import { entriesToMappable, getEntryDate, getEntryName } from '@/lib/entry-helpers';
import { makeFlight, makeLodging, makeCarRental, makeRestaurant, makeActivity } from '../fixtures';

// ---------------------------------------------------------------------------
// entriesToMappable
// ---------------------------------------------------------------------------

describe('entriesToMappable', () => {
  it('includes lodging with lat/lng', () => {
    const lodging = makeLodging({ lat: 34.0522, lng: -118.2437 });
    const pins = entriesToMappable({ lodgings: [lodging], carRentals: [], restaurants: [], activities: [] });
    expect(pins).toHaveLength(1);
    expect(pins[0]).toMatchObject({ id: 'lodging-1', type: 'lodging', lat: 34.0522, lng: -118.2437 });
  });

  it('excludes lodging without lat/lng', () => {
    const lodging = makeLodging({ lat: null, lng: null });
    const pins = entriesToMappable({ lodgings: [lodging], carRentals: [], restaurants: [], activities: [] });
    expect(pins).toHaveLength(0);
  });

  it('includes carRental with pickupLat/pickupLng and uses company as name', () => {
    const car = makeCarRental({ pickupLat: 33.9425, pickupLng: -118.4081, company: 'Hertz' });
    const pins = entriesToMappable({ lodgings: [], carRentals: [car], restaurants: [], activities: [] });
    expect(pins).toHaveLength(1);
    expect(pins[0]).toMatchObject({ type: 'carRental', name: 'Hertz', lat: 33.9425, lng: -118.4081 });
  });

  it('excludes carRental without pickupLat/pickupLng', () => {
    const car = makeCarRental({ pickupLat: null, pickupLng: null });
    const pins = entriesToMappable({ lodgings: [], carRentals: [car], restaurants: [], activities: [] });
    expect(pins).toHaveLength(0);
  });

  it('includes restaurant with lat/lng', () => {
    const r = makeRestaurant({ lat: 34.0623, lng: -118.3072 });
    const pins = entriesToMappable({ lodgings: [], carRentals: [], restaurants: [r], activities: [] });
    expect(pins).toHaveLength(1);
    expect(pins[0]).toMatchObject({ type: 'restaurant', name: 'The Italian Place' });
  });

  it('excludes restaurant without lat/lng', () => {
    const r = makeRestaurant({ lat: null, lng: null });
    const pins = entriesToMappable({ lodgings: [], carRentals: [], restaurants: [r], activities: [] });
    expect(pins).toHaveLength(0);
  });

  it('includes activity with lat/lng', () => {
    const a = makeActivity({ lat: 34.1016, lng: -118.3412 });
    const pins = entriesToMappable({ lodgings: [], carRentals: [], restaurants: [], activities: [a] });
    expect(pins).toHaveLength(1);
    expect(pins[0]).toMatchObject({ type: 'activity', name: 'Hollywood Tour' });
  });

  it('excludes activity without lat/lng', () => {
    const a = makeActivity({ lat: null, lng: null });
    const pins = entriesToMappable({ lodgings: [], carRentals: [], restaurants: [], activities: [a] });
    expect(pins).toHaveLength(0);
  });

  it('never includes flights (flights have no lat/lng in the function signature)', () => {
    // entriesToMappable does not accept flights; an empty set returns no pins
    const pins = entriesToMappable({ lodgings: [], carRentals: [], restaurants: [], activities: [] });
    expect(pins.some((p) => p.type === 'flight')).toBe(false);
  });

  it('returns pins for all entry types in a mixed set', () => {
    const pins = entriesToMappable({
      lodgings: [makeLodging()],
      carRentals: [makeCarRental()],
      restaurants: [makeRestaurant()],
      activities: [makeActivity()],
    });
    expect(pins).toHaveLength(4);
    const types = pins.map((p) => p.type);
    expect(types).toContain('lodging');
    expect(types).toContain('carRental');
    expect(types).toContain('restaurant');
    expect(types).toContain('activity');
  });
});

// ---------------------------------------------------------------------------
// getEntryDate
// ---------------------------------------------------------------------------

describe('getEntryDate', () => {
  it('returns departureDate for flight', () => {
    const flight = makeFlight({ departureDate: new Date('2026-03-01T08:00:00.000Z') });
    const result = getEntryDate('flight', flight);
    expect(result).toBeInstanceOf(Date);
    expect(result!.toISOString()).toBe('2026-03-01T08:00:00.000Z');
  });

  it('returns null for flight idea (no departureDate)', () => {
    const flight = makeFlight({ departureDate: null });
    expect(getEntryDate('flight', flight)).toBeNull();
  });

  it('returns checkIn for lodging', () => {
    const lodging = makeLodging({ checkIn: new Date('2026-03-01T00:00:00.000Z') });
    const result = getEntryDate('lodging', lodging);
    expect(result!.toISOString()).toBe('2026-03-01T00:00:00.000Z');
  });

  it('returns null for lodging idea', () => {
    const lodging = makeLodging({ checkIn: null });
    expect(getEntryDate('lodging', lodging)).toBeNull();
  });

  it('returns pickupDate for carRental', () => {
    const car = makeCarRental({ pickupDate: new Date('2026-03-01T00:00:00.000Z') });
    const result = getEntryDate('carRental', car);
    expect(result!.toISOString()).toBe('2026-03-01T00:00:00.000Z');
  });

  it('returns null for carRental idea', () => {
    const car = makeCarRental({ pickupDate: null });
    expect(getEntryDate('carRental', car)).toBeNull();
  });

  it('returns date for restaurant', () => {
    const r = makeRestaurant({ date: new Date('2026-03-03T00:00:00.000Z') });
    const result = getEntryDate('restaurant', r);
    expect(result!.toISOString()).toBe('2026-03-03T00:00:00.000Z');
  });

  it('returns null for restaurant idea', () => {
    const r = makeRestaurant({ date: null });
    expect(getEntryDate('restaurant', r)).toBeNull();
  });

  it('returns date for activity', () => {
    const a = makeActivity({ date: new Date('2026-03-04T00:00:00.000Z') });
    const result = getEntryDate('activity', a);
    expect(result!.toISOString()).toBe('2026-03-04T00:00:00.000Z');
  });

  it('returns null for activity idea', () => {
    const a = makeActivity({ date: null });
    expect(getEntryDate('activity', a)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getEntryName
// ---------------------------------------------------------------------------

describe('getEntryName', () => {
  it('returns "airline flightNumber" for flight', () => {
    const flight = makeFlight({ airline: 'Delta', flightNumber: 'DL123' });
    expect(getEntryName('flight', flight)).toBe('Delta DL123');
  });

  it('returns just airline when flightNumber is absent', () => {
    const flight = makeFlight({ airline: 'Delta', flightNumber: null });
    expect(getEntryName('flight', flight)).toBe('Delta');
  });

  it('returns name for lodging', () => {
    const lodging = makeLodging({ name: 'The Grand Hotel' });
    expect(getEntryName('lodging', lodging)).toBe('The Grand Hotel');
  });

  it('returns company for carRental', () => {
    const car = makeCarRental({ company: 'Hertz' });
    expect(getEntryName('carRental', car)).toBe('Hertz');
  });

  it('returns name for restaurant', () => {
    const r = makeRestaurant({ name: 'The Italian Place' });
    expect(getEntryName('restaurant', r)).toBe('The Italian Place');
  });

  it('returns name for activity', () => {
    const a = makeActivity({ name: 'Hollywood Tour' });
    expect(getEntryName('activity', a)).toBe('Hollywood Tour');
  });
});
