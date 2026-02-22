/*
  Warnings:

  - A unique constraint covering the columns `[viewerShareCode]` on the table `Trip` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "viewerShareCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Trip_viewerShareCode_key" ON "Trip"("viewerShareCode");
