import { describe, it, expect } from 'vitest';
import {
  createFlightSchema,
  createLodgingSchema,
  createCarRentalSchema,
  createRestaurantSchema,
  createActivitySchema,
  createEntrySchema,
  createFlightIdeaSchema,
  createLodgingIdeaSchema,
  createCarRentalIdeaSchema,
  createRestaurantIdeaSchema,
  createActivityIdeaSchema,
  createIdeaEntrySchema,
} from '@/validators/entry';

// ---------------------------------------------------------------------------
// Plan schemas (dates required)
// ---------------------------------------------------------------------------

describe('createFlightSchema', () => {
  const valid = {
    type: 'flight' as const,
    airline: 'Delta',
    departureDate: '2026-03-01T08:00',
    arrivalDate: '2026-03-01T11:00',
    departureCity: 'New York City',
    arrivalCity: 'Los Angeles',
  };

  it('accepts valid input', () => {
    expect(createFlightSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects missing airline', () => {
    const { airline: _, ...rest } = valid;
    expect(createFlightSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects empty airline', () => {
    expect(createFlightSchema.safeParse({ ...valid, airline: '' }).success).toBe(false);
  });

  it('rejects missing departureDate', () => {
    const { departureDate: _, ...rest } = valid;
    expect(createFlightSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects missing arrivalDate', () => {
    const { arrivalDate: _, ...rest } = valid;
    expect(createFlightSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects missing departureCity', () => {
    const { departureCity: _, ...rest } = valid;
    expect(createFlightSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects missing arrivalCity', () => {
    const { arrivalCity: _, ...rest } = valid;
    expect(createFlightSchema.safeParse(rest).success).toBe(false);
  });

  it('accepts optional fields (flightNumber, cost, notes)', () => {
    const result = createFlightSchema.safeParse({
      ...valid,
      flightNumber: 'DL123',
      cost: 350,
      notes: 'window seat',
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative cost', () => {
    expect(createFlightSchema.safeParse({ ...valid, cost: -1 }).success).toBe(false);
  });

  it('rejects notes over 1000 characters', () => {
    expect(createFlightSchema.safeParse({ ...valid, notes: 'x'.repeat(1001) }).success).toBe(false);
  });
});

describe('createLodgingSchema', () => {
  const valid = {
    type: 'lodging' as const,
    name: 'The Grand Hotel',
    address: '123 Main St',
    checkIn: '2026-03-01',
    checkOut: '2026-03-07',
  };

  it('accepts valid input', () => {
    expect(createLodgingSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects missing name', () => {
    const { name: _, ...rest } = valid;
    expect(createLodgingSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects missing address', () => {
    const { address: _, ...rest } = valid;
    expect(createLodgingSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects missing checkIn', () => {
    const { checkIn: _, ...rest } = valid;
    expect(createLodgingSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects missing checkOut', () => {
    const { checkOut: _, ...rest } = valid;
    expect(createLodgingSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects negative cost', () => {
    expect(createLodgingSchema.safeParse({ ...valid, cost: -1 }).success).toBe(false);
  });
});

describe('createCarRentalSchema', () => {
  const valid = {
    type: 'carRental' as const,
    company: 'Hertz',
    pickupAddress: 'LAX Terminal 1',
    pickupDate: '2026-03-01',
    dropoffDate: '2026-03-07',
  };

  it('accepts valid input', () => {
    expect(createCarRentalSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects missing company', () => {
    const { company: _, ...rest } = valid;
    expect(createCarRentalSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects missing pickupAddress', () => {
    const { pickupAddress: _, ...rest } = valid;
    expect(createCarRentalSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects missing pickupDate', () => {
    const { pickupDate: _, ...rest } = valid;
    expect(createCarRentalSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects missing dropoffDate', () => {
    const { dropoffDate: _, ...rest } = valid;
    expect(createCarRentalSchema.safeParse(rest).success).toBe(false);
  });

  it('accepts optional dropoffAddress', () => {
    const result = createCarRentalSchema.safeParse({ ...valid, dropoffAddress: 'Airport' });
    expect(result.success).toBe(true);
  });

  it('rejects negative cost', () => {
    expect(createCarRentalSchema.safeParse({ ...valid, cost: -5 }).success).toBe(false);
  });
});

describe('createRestaurantSchema', () => {
  const valid = {
    type: 'restaurant' as const,
    name: 'The Italian Place',
    address: '456 Vine St',
    date: '2026-03-03',
  };

  it('accepts valid input', () => {
    expect(createRestaurantSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects missing name', () => {
    const { name: _, ...rest } = valid;
    expect(createRestaurantSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects missing address', () => {
    const { address: _, ...rest } = valid;
    expect(createRestaurantSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects missing date', () => {
    const { date: _, ...rest } = valid;
    expect(createRestaurantSchema.safeParse(rest).success).toBe(false);
  });

  it('accepts optional time, cuisine, priceRange, reservationId', () => {
    const result = createRestaurantSchema.safeParse({
      ...valid,
      time: '7:00 PM',
      cuisine: 'Italian',
      priceRange: '$$',
      reservationId: 'RES123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative cost', () => {
    expect(createRestaurantSchema.safeParse({ ...valid, cost: -1 }).success).toBe(false);
  });

  it('rejects notes over 1000 characters', () => {
    expect(createRestaurantSchema.safeParse({ ...valid, notes: 'x'.repeat(1001) }).success).toBe(false);
  });
});

describe('createActivitySchema', () => {
  const valid = {
    type: 'activity' as const,
    name: 'Hollywood Tour',
    date: '2026-03-04',
  };

  it('accepts valid input', () => {
    expect(createActivitySchema.safeParse(valid).success).toBe(true);
  });

  it('rejects missing name', () => {
    const { name: _, ...rest } = valid;
    expect(createActivitySchema.safeParse(rest).success).toBe(false);
  });

  it('rejects missing date', () => {
    const { date: _, ...rest } = valid;
    expect(createActivitySchema.safeParse(rest).success).toBe(false);
  });

  it('accepts optional startTime, endTime, address, category, bookingRef', () => {
    const result = createActivitySchema.safeParse({
      ...valid,
      address: 'Hollywood Blvd',
      startTime: '10:00 AM',
      endTime: '2:00 PM',
      category: 'Sightseeing',
      bookingRef: 'TOUR001',
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative cost', () => {
    expect(createActivitySchema.safeParse({ ...valid, cost: -1 }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Discriminated union (createEntrySchema)
// ---------------------------------------------------------------------------

describe('createEntrySchema', () => {
  it('dispatches to flight schema on type=flight', () => {
    const result = createEntrySchema.safeParse({
      type: 'flight',
      airline: 'Delta',
      departureDate: '2026-03-01T08:00',
      arrivalDate: '2026-03-01T11:00',
      departureCity: 'NYC',
      arrivalCity: 'LAX',
    });
    expect(result.success).toBe(true);
  });

  it('dispatches to activity schema on type=activity', () => {
    const result = createEntrySchema.safeParse({ type: 'activity', name: 'Hike', date: '2026-03-02' });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown type', () => {
    const result = createEntrySchema.safeParse({ type: 'hotel', name: 'Test' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Idea schemas (dates not required, isIdea must be true)
// ---------------------------------------------------------------------------

describe('createFlightIdeaSchema', () => {
  it('accepts valid idea input without dates', () => {
    const result = createFlightIdeaSchema.safeParse({
      type: 'flight',
      isIdea: true,
      departureCity: 'NYC',
      arrivalCity: 'LAX',
    });
    expect(result.success).toBe(true);
  });

  it('rejects isIdea: false', () => {
    expect(
      createFlightIdeaSchema.safeParse({
        type: 'flight',
        isIdea: false,
        departureCity: 'NYC',
        arrivalCity: 'LAX',
      }).success,
    ).toBe(false);
  });

  it('requires departureCity', () => {
    expect(
      createFlightIdeaSchema.safeParse({ type: 'flight', isIdea: true, arrivalCity: 'LAX' }).success,
    ).toBe(false);
  });
});

describe('createLodgingIdeaSchema', () => {
  it('accepts valid idea input without dates', () => {
    const result = createLodgingIdeaSchema.safeParse({
      type: 'lodging',
      isIdea: true,
      name: 'Hotel',
      address: '123 St',
    });
    expect(result.success).toBe(true);
  });

  it('rejects isIdea: false', () => {
    expect(
      createLodgingIdeaSchema.safeParse({
        type: 'lodging',
        isIdea: false,
        name: 'Hotel',
        address: '123 St',
      }).success,
    ).toBe(false);
  });
});

describe('createCarRentalIdeaSchema', () => {
  it('accepts valid idea input without dates', () => {
    const result = createCarRentalIdeaSchema.safeParse({
      type: 'carRental',
      isIdea: true,
      company: 'Hertz',
      pickupAddress: 'LAX',
    });
    expect(result.success).toBe(true);
  });
});

describe('createRestaurantIdeaSchema', () => {
  it('accepts valid idea input without date', () => {
    const result = createRestaurantIdeaSchema.safeParse({
      type: 'restaurant',
      isIdea: true,
      name: 'Café',
      address: '789 Ave',
    });
    expect(result.success).toBe(true);
  });
});

describe('createActivityIdeaSchema', () => {
  it('accepts valid idea input without date', () => {
    const result = createActivityIdeaSchema.safeParse({
      type: 'activity',
      isIdea: true,
      name: 'Museum Visit',
    });
    expect(result.success).toBe(true);
  });
});

describe('createIdeaEntrySchema', () => {
  it('dispatches to flight idea schema on type=flight', () => {
    const result = createIdeaEntrySchema.safeParse({
      type: 'flight',
      isIdea: true,
      departureCity: 'NYC',
      arrivalCity: 'LAX',
    });
    expect(result.success).toBe(true);
  });

  it('dispatches to activity idea schema on type=activity', () => {
    const result = createIdeaEntrySchema.safeParse({ type: 'activity', isIdea: true, name: 'Hike' });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown type', () => {
    expect(createIdeaEntrySchema.safeParse({ type: 'hotel', isIdea: true }).success).toBe(false);
  });
});
