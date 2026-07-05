-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN "isPureVeg" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Restaurant" ADD COLUMN "offerTag" TEXT;

-- Backfill pure veg from cuisine tags
UPDATE "Restaurant"
SET "isPureVeg" = true
WHERE EXISTS (
  SELECT 1 FROM unnest("cuisines") AS c
  WHERE lower(c) LIKE '%vegetarian%'
     OR lower(c) LIKE '%gujarati%'
     OR lower(c) = 'sweets'
);

-- Backfill offer tags deterministically from id hash
UPDATE "Restaurant"
SET "offerTag" = CASE (abs(hashtext("id"::text)) % 7)
  WHEN 0 THEN '20% OFF up to ₹100'
  WHEN 1 THEN 'Free Delivery'
  WHEN 2 THEN '50% OFF up to ₹80'
  WHEN 3 THEN '30% OFF on first order'
  WHEN 4 THEN 'Flat ₹50 OFF'
  ELSE NULL
END
WHERE "offerTag" IS NULL;
