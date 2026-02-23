import { describe, it, expect } from 'vitest';
import { getCityFromAirportCode } from '@/lib/airports';

describe('getCityFromAirportCode', () => {
  it('returns city for known uppercase code', () => {
    expect(getCityFromAirportCode('JFK')).toBe('New York City');
  });

  it('returns city for known lowercase code', () => {
    expect(getCityFromAirportCode('jfk')).toBe('New York City');
  });

  it('returns city for mixed-case code', () => {
    expect(getCityFromAirportCode('Jfk')).toBe('New York City');
  });

  it('returns correct city for LAX', () => {
    expect(getCityFromAirportCode('LAX')).toBe('Los Angeles');
  });

  it('returns correct city for LHR', () => {
    expect(getCityFromAirportCode('LHR')).toBe('London');
  });

  it('returns correct city for CDG (Paris)', () => {
    expect(getCityFromAirportCode('CDG')).toBe('Paris');
  });

  it('trims surrounding whitespace before lookup', () => {
    expect(getCityFromAirportCode('  JFK  ')).toBe('New York City');
  });

  it('returns undefined for an unknown code', () => {
    expect(getCityFromAirportCode('ZZZ')).toBeUndefined();
  });
});
