import type { User, Trip, TripMember, Flight, Lodging, CarRental, Restaurant, Activity } from '@prisma/client';
import { MemberRole } from '@prisma/client';

const NOW = new Date('2026-01-15T12:00:00.000Z');
const TRIP_START = new Date('2026-03-01T00:00:00.000Z');
const TRIP_END = new Date('2026-03-07T00:00:00.000Z');

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'alice@example.com',
    name: 'Alice Smith',
    passwordHash: '$2b$12$hashedpassword',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-1',
    name: 'Spring Break',
    description: null,
    coverImage: null,
    startDate: TRIP_START,
    endDate: TRIP_END,
    shareCode: 'share-abc123',
    shareRole: MemberRole.COLLABORATOR,
    viewerShareCode: 'view-xyz456',
    ownerId: 'user-1',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function makeTripMember(overrides: Partial<TripMember> = {}): TripMember {
  return {
    id: 'member-1',
    userId: 'user-1',
    tripId: 'trip-1',
    role: MemberRole.OWNER,
    joinedAt: NOW,
    ...overrides,
  };
}

export function makeSession(overrides: { user?: Partial<{ id: string; name: string; email: string }> } = {}) {
  return {
    user: {
      id: 'user-1',
      name: 'Alice Smith',
      email: 'alice@example.com',
      ...overrides.user,
    },
    expires: '2026-12-31T00:00:00.000Z',
  };
}

export function makeFlight(overrides: Partial<Flight> = {}): Flight {
  return {
    id: 'flight-1',
    tripId: 'trip-1',
    isIdea: false,
    airline: 'Delta',
    flightNumber: 'DL123',
    departureDate: new Date('2026-03-01T08:00:00.000Z'),
    arrivalDate: new Date('2026-03-01T11:00:00.000Z'),
    departureCity: 'New York City',
    arrivalCity: 'Los Angeles',
    departureAirport: 'JFK',
    arrivalAirport: 'LAX',
    confirmationNum: 'ABC123',
    notes: null,
    cost: 350,
    createdById: 'user-1',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function makeLodging(overrides: Partial<Lodging> = {}): Lodging {
  return {
    id: 'lodging-1',
    tripId: 'trip-1',
    isIdea: false,
    name: 'The Grand Hotel',
    address: '123 Main St, Los Angeles, CA',
    checkIn: new Date('2026-03-01T00:00:00.000Z'),
    checkOut: new Date('2026-03-07T00:00:00.000Z'),
    lat: 34.0522,
    lng: -118.2437,
    confirmationNum: 'HOTEL123',
    notes: null,
    cost: 1200,
    createdById: 'user-1',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function makeCarRental(overrides: Partial<CarRental> = {}): CarRental {
  return {
    id: 'car-1',
    tripId: 'trip-1',
    isIdea: false,
    company: 'Hertz',
    pickupAddress: 'LAX Terminal 1',
    dropoffAddress: 'LAX Terminal 1',
    pickupDate: new Date('2026-03-01T00:00:00.000Z'),
    dropoffDate: new Date('2026-03-07T00:00:00.000Z'),
    pickupLat: 33.9425,
    pickupLng: -118.4081,
    confirmationNum: 'CAR456',
    notes: null,
    cost: 400,
    createdById: 'user-1',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function makeRestaurant(overrides: Partial<Restaurant> = {}): Restaurant {
  return {
    id: 'restaurant-1',
    tripId: 'trip-1',
    isIdea: false,
    name: 'The Italian Place',
    address: '456 Vine St, Los Angeles, CA',
    date: new Date('2026-03-03T00:00:00.000Z'),
    time: '7:00 PM',
    lat: 34.0623,
    lng: -118.3072,
    cuisine: 'Italian',
    priceRange: '$$',
    reservationId: 'RES789',
    notes: null,
    cost: 80,
    createdById: 'user-1',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'activity-1',
    tripId: 'trip-1',
    isIdea: false,
    name: 'Hollywood Tour',
    address: 'Hollywood Blvd, Los Angeles, CA',
    date: new Date('2026-03-04T00:00:00.000Z'),
    startTime: '10:00 AM',
    endTime: '2:00 PM',
    lat: 34.1016,
    lng: -118.3412,
    category: 'Sightseeing',
    cost: 50,
    notes: null,
    bookingRef: 'TOUR001',
    createdById: 'user-1',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function makeEntriesData(overrides: Partial<{
  flights: Flight[];
  lodgings: Lodging[];
  carRentals: CarRental[];
  restaurants: Restaurant[];
  activities: Activity[];
}> = {}) {
  return {
    flights: [makeFlight()],
    lodgings: [makeLodging()],
    carRentals: [makeCarRental()],
    restaurants: [makeRestaurant()],
    activities: [makeActivity()],
    ...overrides,
  };
}
