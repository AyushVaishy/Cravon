-- AlterTable
ALTER TABLE "Order" ADD COLUMN "contactless" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN "deliveryPhone" TEXT;
