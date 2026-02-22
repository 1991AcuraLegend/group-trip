-- AlterEnum
ALTER TYPE "MemberRole" ADD VALUE 'VIEWER';

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "shareRole" "MemberRole" NOT NULL DEFAULT 'COLLABORATOR';
