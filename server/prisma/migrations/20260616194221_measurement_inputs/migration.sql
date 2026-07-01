-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "hasReferenceObject" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "measuredAreaSqft" DOUBLE PRECISION;
