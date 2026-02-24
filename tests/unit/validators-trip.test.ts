import { describe, it, expect } from 'vitest';
import { createTripSchema, updateTripSchema } from '@/validators/trip';

describe('createTripSchema', () => {
  it('accepts a minimal valid trip (name only)', () => {
    expect(createTripSchema.safeParse({ name: 'Beach Trip' }).success).toBe(true);
  });

  it('rejects an empty name', () => {
    expect(createTripSchema.safeParse({ name: '' }).success).toBe(false);
  });

  it('rejects a missing name', () => {
    expect(createTripSchema.safeParse({}).success).toBe(false);
  });

  it('rejects a name over 100 characters', () => {
    expect(createTripSchema.safeParse({ name: 'a'.repeat(101) }).success).toBe(false);
  });

  it('accepts a name of exactly 100 characters', () => {
    expect(createTripSchema.safeParse({ name: 'a'.repeat(100) }).success).toBe(true);
  });

  it('accepts optional description', () => {
    const result = createTripSchema.safeParse({ name: 'Beach Trip', description: 'Fun in the sun' });
    expect(result.success).toBe(true);
  });

  it('rejects description over 500 characters', () => {
    expect(
      createTripSchema.safeParse({ name: 'Beach Trip', description: 'x'.repeat(501) }).success,
    ).toBe(false);
  });

  it('accepts optional startDate, endDate, coverImage', () => {
    const result = createTripSchema.safeParse({
      name: 'Beach Trip',
      startDate: '2026-03-01',
      endDate: '2026-03-07',
      coverImage: '/uploads/cover.jpg',
    });
    expect(result.success).toBe(true);
  });
});

describe('updateTripSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    expect(updateTripSchema.safeParse({}).success).toBe(true);
  });

  it('accepts only a name', () => {
    expect(updateTripSchema.safeParse({ name: 'New Name' }).success).toBe(true);
  });

  it('accepts only a description', () => {
    expect(updateTripSchema.safeParse({ description: 'Updated desc' }).success).toBe(true);
  });

  it('still validates name length when provided', () => {
    expect(updateTripSchema.safeParse({ name: '' }).success).toBe(false);
    expect(updateTripSchema.safeParse({ name: 'a'.repeat(101) }).success).toBe(false);
  });
});
