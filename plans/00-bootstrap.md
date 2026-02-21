# WS 0 — Bootstrap

> **Prerequisite for all other workstreams.** Must be merged first.

---

## Overview

Scaffold the Next.js project, install all dependencies, configure Prisma with the full database schema, define shared types/validators/utilities, and set up the provider wrappers. After this workstream completes, all other workstreams can begin in parallel.

---

## Files to Create

### 1. Project scaffold & config

#### `package.json`
Initialize with `npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` then add dependencies:

**Dependencies:**
```
next@14  react  react-dom  typescript
@prisma/client  prisma
next-auth
leaflet  react-leaflet  @types/leaflet
tailwindcss  postcss  autoprefixer
@tanstack/react-query
react-hook-form  @hookform/resolvers  zod
nanoid  bcryptjs  @types/bcryptjs
```

**Dev dependencies:**
```
@types/node  @types/react  @types/react-dom
vitest  @vitejs/plugin-react  @testing-library/react  @testing-library/jest-dom
playwright  @playwright/test
```

#### `next.config.js`
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
};
module.exports = nextConfig;
```

#### `tailwind.config.ts`
Standard Next.js Tailwind config with `content: ["./src/**/*.{ts,tsx}"]`.

#### `tsconfig.json`
Standard Next.js strict TypeScript config with `@/*` path alias pointing to `./src/*`.

#### `vitest.config.ts`
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

#### `playwright.config.ts`
Standard Playwright config targeting `http://localhost:3000`.

#### `tests/setup.ts`
Import `@testing-library/jest-dom`.

#### `.env.example`
```
DATABASE_URL="postgresql://user:password@localhost:5432/travelplanner"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
```

#### `.gitignore`
Standard Next.js gitignore + `.env.local`, `public/uploads/*` (keep `.gitkeep`).

---

### 2. Prisma Schema

#### `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String       @id @default(cuid())
  email        String       @unique
  name         String
  passwordHash String
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  ownedTrips   Trip[]       @relation("TripOwner")
  memberships  TripMember[]
  flights      Flight[]
  lodgings     Lodging[]
  carRentals   CarRental[]
  restaurants  Restaurant[]
  activities   Activity[]
}

model Trip {
  id          String       @id @default(cuid())
  name        String
  description String?
  coverImage  String?
  startDate   DateTime?
  endDate     DateTime?
  shareCode   String?      @unique
  ownerId     String
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  owner       User         @relation("TripOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  members     TripMember[]
  flights     Flight[]
  lodgings    Lodging[]
  carRentals  CarRental[]
  restaurants Restaurant[]
  activities  Activity[]
}

enum MemberRole {
  OWNER
  COLLABORATOR
}

model TripMember {
  id       String     @id @default(cuid())
  userId   String
  tripId   String
  role     MemberRole @default(COLLABORATOR)
  joinedAt DateTime   @default(now())

  user     User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  trip     Trip       @relation(fields: [tripId], references: [id], onDelete: Cascade)

  @@unique([userId, tripId])
}

model Flight {
  id             String   @id @default(cuid())
  tripId         String
  airline        String
  flightNumber   String?
  departureDate  DateTime
  arrivalDate    DateTime
  departureCity  String
  arrivalCity    String
  departureAirport String?
  arrivalAirport   String?
  confirmationNum  String?
  notes          String?
  cost           Float?
  createdById    String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  trip           Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)
  createdBy      User     @relation(fields: [createdById], references: [id])
}

model Lodging {
  id              String   @id @default(cuid())
  tripId          String
  name            String
  address         String
  checkIn         DateTime
  checkOut        DateTime
  lat             Float?
  lng             Float?
  confirmationNum String?
  notes           String?
  cost            Float?
  createdById     String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  trip            Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)
  createdBy       User     @relation(fields: [createdById], references: [id])
}

model CarRental {
  id              String   @id @default(cuid())
  tripId          String
  company         String
  pickupAddress   String
  dropoffAddress  String?
  pickupDate      DateTime
  dropoffDate     DateTime
  pickupLat       Float?
  pickupLng       Float?
  confirmationNum String?
  notes           String?
  cost            Float?
  createdById     String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  trip            Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)
  createdBy       User     @relation(fields: [createdById], references: [id])
}

model Restaurant {
  id             String   @id @default(cuid())
  tripId         String
  name           String
  address        String
  date           DateTime
  time           String?
  lat            Float?
  lng            Float?
  cuisine        String?
  priceRange     String?
  reservationId  String?
  notes          String?
  cost           Float?
  createdById    String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  trip           Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)
  createdBy      User     @relation(fields: [createdById], references: [id])
}

model Activity {
  id          String   @id @default(cuid())
  tripId      String
  name        String
  address     String?
  date        DateTime
  startTime   String?
  endTime     String?
  lat         Float?
  lng         Float?
  category    String?
  cost        Float?
  notes       String?
  bookingRef  String?
  createdById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  trip        Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)
  createdBy   User     @relation(fields: [createdById], references: [id])
}
```

---

### 3. Shared Types

#### `src/types/index.ts`

```ts
// Re-export Prisma types for convenience
export type { User, Trip, TripMember, Flight, Lodging, CarRental, Restaurant, Activity } from '@prisma/client';
export { MemberRole } from '@prisma/client';

// Entry type discriminator
export type EntryType = 'flight' | 'lodging' | 'carRental' | 'restaurant' | 'activity';

// Union type for all entries
export type Entry =
  | { type: 'flight'; data: Flight }
  | { type: 'lodging'; data: Lodging }
  | { type: 'carRental'; data: CarRental }
  | { type: 'restaurant'; data: Restaurant }
  | { type: 'activity'; data: Activity };

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
  members: (TripMember & { user: Pick<User, 'id' | 'name' | 'email'> })[];
};

// Mappable entry (has lat/lng)
export type MappableEntry = {
  id: string;
  type: Exclude<EntryType, 'flight'>;
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
};

// Share info
export type ShareInfo = {
  shareCode: string | null;
  shareUrl: string | null;
  memberCount: number;
};
```

Import from `@prisma/client` types will be available after `prisma generate`.

---

### 4. Shared Validators

#### `src/validators/trip.ts`
```ts
import { z } from 'zod';

export const createTripSchema = z.object({
  name: z.string().min(1, 'Trip name is required').max(100),
  description: z.string().max(500).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const updateTripSchema = createTripSchema.partial();

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
```

#### `src/validators/entry.ts`
```ts
import { z } from 'zod';

const baseEntryFields = {
  notes: z.string().max(1000).optional(),
  cost: z.number().positive().optional(),
};

export const createFlightSchema = z.object({
  type: z.literal('flight'),
  airline: z.string().min(1, 'Airline is required'),
  flightNumber: z.string().optional(),
  departureDate: z.string().datetime(),
  arrivalDate: z.string().datetime(),
  departureCity: z.string().min(1, 'Departure city is required'),
  arrivalCity: z.string().min(1, 'Arrival city is required'),
  departureAirport: z.string().optional(),
  arrivalAirport: z.string().optional(),
  confirmationNum: z.string().optional(),
  ...baseEntryFields,
});

export const createLodgingSchema = z.object({
  type: z.literal('lodging'),
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  confirmationNum: z.string().optional(),
  ...baseEntryFields,
});

export const createCarRentalSchema = z.object({
  type: z.literal('carRental'),
  company: z.string().min(1, 'Company is required'),
  pickupAddress: z.string().min(1, 'Pickup address is required'),
  dropoffAddress: z.string().optional(),
  pickupDate: z.string().datetime(),
  dropoffDate: z.string().datetime(),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  confirmationNum: z.string().optional(),
  ...baseEntryFields,
});

export const createRestaurantSchema = z.object({
  type: z.literal('restaurant'),
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  date: z.string().datetime(),
  time: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  cuisine: z.string().optional(),
  priceRange: z.string().optional(),
  reservationId: z.string().optional(),
  ...baseEntryFields,
});

export const createActivitySchema = z.object({
  type: z.literal('activity'),
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional(),
  date: z.string().datetime(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  category: z.string().optional(),
  bookingRef: z.string().optional(),
  ...baseEntryFields,
});

export const createEntrySchema = z.discriminatedUnion('type', [
  createFlightSchema,
  createLodgingSchema,
  createCarRentalSchema,
  createRestaurantSchema,
  createActivitySchema,
]);

export type CreateEntryInput = z.infer<typeof createEntrySchema>;
```

#### `src/validators/auth.ts`
```ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Server-side schema (no confirmPassword — used by /api/auth/register)
export const registerApiSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
```

#### `src/validators/sharing.ts`
```ts
import { z } from 'zod';

export const removeMemberSchema = z.object({
  memberId: z.string().cuid(),
});
```

---

### 5. Shared Utilities

#### `src/lib/prisma.ts`
```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

#### `src/lib/constants.ts`
```ts
export const ENTRY_COLORS = {
  lodging: '#3B82F6',    // blue
  carRental: '#F97316',  // orange
  restaurant: '#EF4444', // red
  activity: '#22C55E',   // green
} as const;

export const ENTRY_LABELS = {
  flight: 'Flight',
  lodging: 'Lodging',
  carRental: 'Car Rental',
  restaurant: 'Restaurant',
  activity: 'Activity',
} as const;

export const SHARE_CODE_LENGTH = 10;
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
```

#### `src/lib/share-codes.ts`
```ts
import { nanoid } from 'nanoid';
import { SHARE_CODE_LENGTH } from './constants';

export function generateShareCode(): string {
  return nanoid(SHARE_CODE_LENGTH);
}
```

---

### 6. Providers

#### `src/providers/QueryProvider.tsx`
```tsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000, refetchOnWindowFocus: true },
    },
  }));
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

#### `src/providers/AuthProvider.tsx`
```tsx
'use client';
import { SessionProvider } from 'next-auth/react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

---

### 7. Root Layout

#### `src/app/layout.tsx`
```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TravelPlanner',
  description: 'Plan your trips collaboratively',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

#### `src/app/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

#### `src/app/page.tsx`
```tsx
import { redirect } from 'next/navigation';
export default function Home() {
  redirect('/dashboard');
}
```

---

### 8. Placeholder directories
Create `.gitkeep` files in:
- `public/uploads/.gitkeep`
- `public/marker-icons/.gitkeep`
- `tests/unit/.gitkeep`
- `tests/e2e/.gitkeep`

---

## Verification Checklist

- [ ] `npm install` completes without errors
- [ ] `npx prisma generate` succeeds
- [ ] `npx prisma db push` creates all tables (requires running PostgreSQL)
- [ ] `npx next dev` starts without errors
- [ ] TypeScript compiles cleanly: `npx tsc --noEmit`
- [ ] All shared types/validators importable from their paths
- [ ] Tailwind classes render correctly
- [ ] `.env.example` documents all required env vars

---

## What This Workstream Exports (consumed by others)

| Export | Consumed By |
|--------|------------|
| `prisma` client singleton | WS 1, 2, 3, 6 |
| Prisma schema + generated types | All |
| `src/types/index.ts` | All |
| `src/validators/*` | WS 1, 2, 3, 4, 6 |
| `src/lib/constants.ts` | WS 4, 5 |
| `src/lib/share-codes.ts` | WS 6 |
| `QueryProvider`, `AuthProvider` | WS 1, 2, 4 |
| Root layout with providers | All |
| `src/app/globals.css` with Tailwind | All |
