-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'COLLABORATOR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "shareCode" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'COLLABORATOR',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flight" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "airline" TEXT NOT NULL,
    "flightNumber" TEXT,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "arrivalDate" TIMESTAMP(3) NOT NULL,
    "departureCity" TEXT NOT NULL,
    "arrivalCity" TEXT NOT NULL,
    "departureAirport" TEXT,
    "arrivalAirport" TEXT,
    "confirmationNum" TEXT,
    "notes" TEXT,
    "cost" DOUBLE PRECISION,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lodging" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "confirmationNum" TEXT,
    "notes" TEXT,
    "cost" DOUBLE PRECISION,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lodging_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarRental" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "dropoffAddress" TEXT,
    "pickupDate" TIMESTAMP(3) NOT NULL,
    "dropoffDate" TIMESTAMP(3) NOT NULL,
    "pickupLat" DOUBLE PRECISION,
    "pickupLng" DOUBLE PRECISION,
    "confirmationNum" TEXT,
    "notes" TEXT,
    "cost" DOUBLE PRECISION,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarRental_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Restaurant" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "cuisine" TEXT,
    "priceRange" TEXT,
    "reservationId" TEXT,
    "notes" TEXT,
    "cost" DOUBLE PRECISION,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "category" TEXT,
    "cost" DOUBLE PRECISION,
    "notes" TEXT,
    "bookingRef" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Trip_shareCode_key" ON "Trip"("shareCode");

-- CreateIndex
CREATE UNIQUE INDEX "TripMember_userId_tripId_key" ON "TripMember"("userId", "tripId");

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripMember" ADD CONSTRAINT "TripMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripMember" ADD CONSTRAINT "TripMember_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lodging" ADD CONSTRAINT "Lodging_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lodging" ADD CONSTRAINT "Lodging_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarRental" ADD CONSTRAINT "CarRental_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarRental" ADD CONSTRAINT "CarRental_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
