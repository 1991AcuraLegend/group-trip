-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "attendeeIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "CarRental" ADD COLUMN     "attendeeIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Flight" ADD COLUMN     "attendeeIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Lodging" ADD COLUMN     "attendeeIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "attendeeIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
