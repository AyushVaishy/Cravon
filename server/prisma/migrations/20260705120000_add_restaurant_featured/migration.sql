-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: feature top-rated approved restaurants
UPDATE "Restaurant"
SET "isFeatured" = true
WHERE "isApproved" = true AND "avgRating" >= 4.5
  AND id IN (
    SELECT id FROM "Restaurant"
    WHERE "isApproved" = true AND "avgRating" >= 4.5
    ORDER BY "avgRating" DESC, "totalRatings" DESC
    LIMIT 12
  );
