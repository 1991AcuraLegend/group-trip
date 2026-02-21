# 🌍 TravelPlanner

A collaborative web application for planning group travel together. Create trips, organize travel details, visualize them on interactive maps, and share with travel companions.

## ✨ Features

### Trip Management
- **Create and organize trips**: Set up trips with destination details
- **Comprehensive entry types**: Track all aspects of your journey
  - ✈️ Flights
  - 🏨 Lodging
  - 🚗 Car Rentals
  - 🍽️ Restaurants
  - 🎭 Activities
- **Detailed entry information**: Add dates, times, addresses, and descriptions for each item
- **Timeline view**: See all trip activities organized chronologically

### Collaboration & Sharing
- **Share with others**: Generate shareable links to invite travel companions
- **Member management**: View all trip members and see who's invited
- **Role-based access**: Trip owners and collaborators with different permission levels
- **Easy joining**: Collaborators can join trips via share codes

### Visualization
- **Interactive map**: View all trip destinations and points of interest on an OpenStreetMap
- **Smart geocoding**: Automatic location lookup for addresses
- **Color-coded markers**: Different colors for different entry types

### Account Management
- **User authentication**: Secure login and registration
- **Password reset**: Recover your account if needed
- **Profile settings**: Change your name and password

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Installation

1. **Clone and install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   Create a `.env.local` file with:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/travelplanner"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Set up the database**
   ```bash
   npx prisma migrate dev
   ```

### Running the Application

- **Development server** (port 3000):
  ```bash
  npm run dev
  ```

- **Production build**:
  ```bash
  npm run build
  ```

### Testing

- **Unit tests**:
  ```bash
  npm run test
  ```

- **End-to-end tests** (requires dev server running):
  ```bash
  npm run test:e2e
  ```

- **Linting**:
  ```bash
  npm run lint
  ```

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL with Prisma ORM |
| Authentication | NextAuth.js (Credentials provider) |
| Maps | Leaflet + OpenStreetMap (no API keys required) |
| Geocoding | Nominatim (OpenStreetMap-based) |
| Styling | Tailwind CSS |
| State Management | TanStack React Query |
| Forms | React Hook Form with Zod validation |
| Testing | Vitest (unit), Playwright (e2e) |

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages and API routes
├── components/          # Reusable React components
├── hooks/              # Custom React hooks for data fetching
├── lib/                # Utility functions and helpers
├── providers/          # Context providers (Auth, Query, Theme)
├── types/              # TypeScript type definitions
├── validators/         # Zod validation schemas
└── middleware.ts       # Route protection middleware
```

## 🔐 Authentication

- Secure password authentication with bcryptjs
- Session-based authentication with NextAuth.js
- Protected routes for authenticated users
- Public pages for login, registration, and trip joining

## 📊 Database Schema

Key entities:
- **Users**: User accounts with email and password
- **Trips**: Travel plans with destinations
- **Trip Entries**: Five types (flights, lodging, car rentals, restaurants, activities)
- **Trip Members**: Users collaborating on trips with role-based access

## 🎯 Getting Involved

To start contributing or exploring the codebase:

1. Check `CLAUDE.md` for architecture details and key patterns
2. Review `MASTER_PLAN.md` for the development roadmap
3. Explore individual plan files in `plans/` for feature specifications

## 📝 Environment Setup

For database GUI:
```bash
npx prisma studio
```

This opens an interactive Prisma Studio for managing your database.

---

**Happy travels! 🧳**
