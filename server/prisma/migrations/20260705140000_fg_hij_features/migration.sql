-- Restaurant extras
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "deliveryFee" INTEGER NOT NULL DEFAULT 2900;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "galleryUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "acceptsOnlinePayment" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "hasVegMenu" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "hasNonVegMenu" BOOLEAN NOT NULL DEFAULT true;

-- MenuItem extras
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "offerPrice" INTEGER;
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "prepTime" INTEGER;
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "calories" INTEGER;
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "nutritionInfo" TEXT;
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "ingredients" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "allergens" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "orderCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "isCombo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "comboDescription" TEXT;

-- OrderItem extras
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "customizations" JSONB;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "itemNotes" TEXT;

-- Review photos
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "images" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Favorites & history
CREATE TABLE IF NOT EXISTS "FavoriteRestaurant" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FavoriteRestaurant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "FavoriteRestaurant_userId_restaurantId_key" ON "FavoriteRestaurant"("userId", "restaurantId");
CREATE INDEX IF NOT EXISTS "FavoriteRestaurant_userId_idx" ON "FavoriteRestaurant"("userId");
ALTER TABLE "FavoriteRestaurant" ADD CONSTRAINT "FavoriteRestaurant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FavoriteRestaurant" ADD CONSTRAINT "FavoriteRestaurant_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "FavoriteMenuItem" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "menuItemId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FavoriteMenuItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "FavoriteMenuItem_userId_menuItemId_key" ON "FavoriteMenuItem"("userId", "menuItemId");
CREATE INDEX IF NOT EXISTS "FavoriteMenuItem_userId_idx" ON "FavoriteMenuItem"("userId");
ALTER TABLE "FavoriteMenuItem" ADD CONSTRAINT "FavoriteMenuItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FavoriteMenuItem" ADD CONSTRAINT "FavoriteMenuItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "BrowseHistory" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BrowseHistory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "BrowseHistory_userId_restaurantId_key" ON "BrowseHistory"("userId", "restaurantId");
CREATE INDEX IF NOT EXISTS "BrowseHistory_userId_idx" ON "BrowseHistory"("userId");
ALTER TABLE "BrowseHistory" ADD CONSTRAINT "BrowseHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BrowseHistory" ADD CONSTRAINT "BrowseHistory_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "RestaurantReport" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "details" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RestaurantReport_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "RestaurantReport_restaurantId_idx" ON "RestaurantReport"("restaurantId");
ALTER TABLE "RestaurantReport" ADD CONSTRAINT "RestaurantReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RestaurantReport" ADD CONSTRAINT "RestaurantReport_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill veg flags from menu
UPDATE "Restaurant" r SET "hasVegMenu" = EXISTS (
  SELECT 1 FROM "MenuItem" m WHERE m."restaurantId" = r.id AND m."isVeg" = true
);
UPDATE "Restaurant" r SET "hasNonVegMenu" = EXISTS (
  SELECT 1 FROM "MenuItem" m WHERE m."restaurantId" = r.id AND m."isVeg" = false
);
UPDATE "Restaurant" SET "hasNonVegMenu" = false WHERE "isPureVeg" = true;

-- Backfill order counts
UPDATE "MenuItem" m SET "orderCount" = sub.cnt FROM (
  SELECT oi."menuItemId", COUNT(*)::int AS cnt
  FROM "OrderItem" oi
  JOIN "Order" o ON o.id = oi."orderId"
  WHERE o.status != 'CANCELLED'
  GROUP BY oi."menuItemId"
) sub WHERE m.id = sub."menuItemId";

-- Backfill prep time / calories for variety
UPDATE "MenuItem" SET "prepTime" = 15 + (abs(hashtext(id::text)) % 20) WHERE "prepTime" IS NULL;
UPDATE "MenuItem" SET "calories" = 200 + (abs(hashtext(id::text)) % 600) WHERE "calories" IS NULL;
