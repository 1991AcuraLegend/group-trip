-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN "attendeeIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN "attendeeIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
