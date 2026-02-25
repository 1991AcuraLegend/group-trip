import { z } from "zod";

const baseEntryFields = {
  notes: z.string().max(1000).optional(),
  cost: z.number().nonnegative().optional(),
  attendeeIds: z.array(z.string()).optional().default([]),
};

// ─── Plan entry schemas (dates required) ─────────────────────────────────────

export const createFlightSchema = z.object({
  type: z.literal("flight"),
  isIdea: z.boolean().optional(),
  airline: z.string().min(1, "Airline is required"),
  flightNumber: z.string().optional(),
  departureDate: z.string().min(1, "Departure date is required"),
  arrivalDate: z.string().min(1, "Arrival date is required"),
  departureCity: z.string().min(1, "Departure city is required"),
  arrivalCity: z.string().min(1, "Arrival city is required"),
  departureAirport: z.string().optional(),
  arrivalAirport: z.string().optional(),
  confirmationNum: z.string().optional(),
  ...baseEntryFields,
});

export const createLodgingSchema = z.object({
  type: z.literal("lodging"),
  isIdea: z.boolean().optional(),
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  checkIn: z.string().min(1, "Check-in date is required"),
  checkOut: z.string().min(1, "Check-out date is required"),
  lat: z.number().optional(),
  lng: z.number().optional(),
  confirmationNum: z.string().optional(),
  ...baseEntryFields,
});

export const createCarRentalSchema = z.object({
  type: z.literal("carRental"),
  isIdea: z.boolean().optional(),
  company: z.string().min(1, "Company is required"),
  pickupAddress: z.string().min(1, "Pickup address is required"),
  dropoffAddress: z.string().optional(),
  pickupDate: z.string().min(1, "Pickup date is required"),
  dropoffDate: z.string().min(1, "Drop-off date is required"),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  confirmationNum: z.string().optional(),
  ...baseEntryFields,
});

export const createRestaurantSchema = z.object({
  type: z.literal("restaurant"),
  isIdea: z.boolean().optional(),
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  cuisine: z.string().optional(),
  priceRange: z.string().optional(),
  reservationId: z.string().optional(),
  ...baseEntryFields,
});

export const createActivitySchema = z.object({
  type: z.literal("activity"),
  isIdea: z.boolean().optional(),
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  category: z.string().optional(),
  bookingRef: z.string().optional(),
  ...baseEntryFields,
});

export const createEntrySchema = z.discriminatedUnion("type", [
  createFlightSchema,
  createLodgingSchema,
  createCarRentalSchema,
  createRestaurantSchema,
  createActivitySchema,
]);

export type CreateEntryInput = z.infer<typeof createEntrySchema>;

// ─── Idea entry schemas (dates not required) ─────────────────────────────────

export const createFlightIdeaSchema = z.object({
  type: z.literal("flight"),
  isIdea: z.literal(true),
  departureCity: z.string().min(1, "Departure city is required"),
  arrivalCity: z.string().min(1, "Arrival city is required"),
  airline: z.string().default(''),
  ...baseEntryFields,
});

export const createLodgingIdeaSchema = z.object({
  type: z.literal("lodging"),
  isIdea: z.literal(true),
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  lat: z.number().optional(),
  lng: z.number().optional(),
  ...baseEntryFields,
});

export const createCarRentalIdeaSchema = z.object({
  type: z.literal("carRental"),
  isIdea: z.literal(true),
  company: z.string().min(1, "Company is required"),
  pickupAddress: z.string().min(1, "Pickup address is required"),
  dropoffAddress: z.string().optional(),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  ...baseEntryFields,
});

export const createRestaurantIdeaSchema = z.object({
  type: z.literal("restaurant"),
  isIdea: z.literal(true),
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  lat: z.number().optional(),
  lng: z.number().optional(),
  cuisine: z.string().optional(),
  ...baseEntryFields,
});

export const createActivityIdeaSchema = z.object({
  type: z.literal("activity"),
  isIdea: z.literal(true),
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  category: z.string().optional(),
  ...baseEntryFields,
});

export const createIdeaEntrySchema = z.discriminatedUnion("type", [
  createFlightIdeaSchema,
  createLodgingIdeaSchema,
  createCarRentalIdeaSchema,
  createRestaurantIdeaSchema,
  createActivityIdeaSchema,
]);

export type CreateIdeaEntryInput = z.infer<typeof createIdeaEntrySchema>;
