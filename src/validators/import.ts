import { z } from 'zod';

const optionalString = z.string().optional();
const optionalNumber = z.number().optional();

const importFlightSchema = z.object({
  airline: z.string().min(1),
  flightNumber: optionalString,
  departureDate: optionalString,
  arrivalDate: optionalString,
  departureCity: z.string().min(1),
  arrivalCity: z.string().min(1),
  departureAirport: optionalString,
  arrivalAirport: optionalString,
  confirmationNum: optionalString,
  notes: optionalString,
  cost: optionalNumber,
});

const importLodgingSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  checkIn: optionalString,
  checkOut: optionalString,
  lat: optionalNumber,
  lng: optionalNumber,
  confirmationNum: optionalString,
  notes: optionalString,
  cost: optionalNumber,
});

const importCarRentalSchema = z.object({
  company: z.string().min(1),
  pickupAddress: z.string().min(1),
  dropoffAddress: optionalString,
  pickupDate: optionalString,
  dropoffDate: optionalString,
  pickupLat: optionalNumber,
  pickupLng: optionalNumber,
  confirmationNum: optionalString,
  notes: optionalString,
  cost: optionalNumber,
});

const importRestaurantSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  date: optionalString,
  time: optionalString,
  lat: optionalNumber,
  lng: optionalNumber,
  cuisine: optionalString,
  priceRange: optionalString,
  reservationId: optionalString,
  notes: optionalString,
  cost: optionalNumber,
});

const importActivitySchema = z.object({
  name: z.string().min(1),
  address: optionalString,
  date: optionalString,
  startTime: optionalString,
  endTime: optionalString,
  lat: optionalNumber,
  lng: optionalNumber,
  category: optionalString,
  bookingRef: optionalString,
  notes: optionalString,
  cost: optionalNumber,
});

export const importTripSchema = z.object({
  version: z.literal(1),
  trip: z.object({
    name: z.string().min(1, 'Trip name is required'),
    description: z.string().nullable().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
  }),
  entries: z.object({
    flights: z.array(importFlightSchema).default([]),
    lodgings: z.array(importLodgingSchema).default([]),
    carRentals: z.array(importCarRentalSchema).default([]),
    restaurants: z.array(importRestaurantSchema).default([]),
    activities: z.array(importActivitySchema).default([]),
  }),
});

export type ImportTripInput = z.infer<typeof importTripSchema>;
