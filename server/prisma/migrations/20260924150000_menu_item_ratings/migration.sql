ALTER TABLE "MenuItem" ADD COLUMN "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "MenuItem" ADD COLUMN "ratingCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "ItemRating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemRating_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ItemRating_userId_menuItemId_key" ON "ItemRating"("userId", "menuItemId");
CREATE INDEX "ItemRating_menuItemId_idx" ON "ItemRating"("menuItemId");

ALTER TABLE "ItemRating" ADD CONSTRAINT "ItemRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ItemRating" ADD CONSTRAINT "ItemRating_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
