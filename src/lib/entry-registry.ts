import type { PrismaClient } from '@prisma/client';
import type { EntryType } from '@/types';
import { z } from 'zod';
import {
  createFlightSchema,
  createLodgingSchema,
  createCarRentalSchema,
  createRestaurantSchema,
  createActivitySchema,
} from '@/validators/entry';

type EntryConfig = {
  delegate: (prisma: PrismaClient) => any;
  dateFields: string[];
  createSchema: z.ZodObject<z.ZodRawShape>;
  pluralKey: string;
};

export const entryRegistry: Record<EntryType, EntryConfig> = {
  flight: {
    delegate: (p) => p.flight,
    dateFields: ['departureDate', 'arrivalDate'],
    createSchema: createFlightSchema as unknown as z.ZodObject<z.ZodRawShape>,
    pluralKey: 'flights',
  },
  lodging: {
    delegate: (p) => p.lodging,
    dateFields: ['checkIn', 'checkOut'],
    createSchema: createLodgingSchema as unknown as z.ZodObject<z.ZodRawShape>,
    pluralKey: 'lodgings',
  },
  carRental: {
    delegate: (p) => p.carRental,
    dateFields: ['pickupDate', 'dropoffDate'],
    createSchema: createCarRentalSchema as unknown as z.ZodObject<z.ZodRawShape>,
    pluralKey: 'carRentals',
  },
  restaurant: {
    delegate: (p) => p.restaurant,
    dateFields: ['date'],
    createSchema: createRestaurantSchema as unknown as z.ZodObject<z.ZodRawShape>,
    pluralKey: 'restaurants',
  },
  activity: {
    delegate: (p) => p.activity,
    dateFields: ['date'],
    createSchema: createActivitySchema as unknown as z.ZodObject<z.ZodRawShape>,
    pluralKey: 'activities',
  },
};

export const ENTRY_TYPES: EntryType[] = ['flight', 'lodging', 'carRental', 'restaurant', 'activity'];

export function convertDates(type: EntryType, data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data };
  for (const field of entryRegistry[type].dateFields) {
    if (typeof result[field] === 'string') {
      result[field] = new Date(result[field] as string);
    }
  }
  return result;
}
