// Re-export Prisma types for convenience
export type {
  User,
  Trip,
  TripMember,
  Flight,
  Lodging,
  CarRental,
  Restaurant,
  Activity,
} from "@prisma/client";
export { MemberRole } from "@prisma/client";

// Entry type discriminator
export type EntryType =
  | "flight"
  | "lodging"
  | "carRental"
  | "restaurant"
  | "activity";

// Union type for all entries
import type {
  Flight,
  Lodging,
  CarRental,
  Restaurant,
  Activity,
  Trip,
  TripMember,
  User,
} from "@prisma/client";

export type Entry =
  | { type: "flight"; data: Flight }
  | { type: "lodging"; data: Lodging }
  | { type: "carRental"; data: CarRental }
  | { type: "restaurant"; data: Restaurant }
  | { type: "activity"; data: Activity };

// API response wrappers
export type ApiResponse<T> = { data: T } | { error: string };

// Trip with relations (used in dashboard)
export type TripWithMemberCount = Trip & { _count: { members: number } };

// Trip with all entries (used in trip detail)
export type TripWithEntries = Trip & {
  flights: Flight[];
  lodgings: Lodging[];
  carRentals: CarRental[];
  restaurants: Restaurant[];
  activities: Activity[];
  members: (TripMember & { user: Pick<User, "id" | "name" | "email"> })[];
};

// Mappable entry (has lat/lng)
export type MappableEntry = {
  id: string;
  type: Exclude<EntryType, "flight">;
  name: string;
  lat: number;
  lng: number;
  address: string;
};

// Geocoding result
export type GeocodingResult = {
  displayName: string;
  lat: number;
  lng: number;
  name?: string;
};

// Share info
export type ShareInfo = {
  shareCode: string | null;
  shareUrl: string | null;
  memberCount: number;
};
