-- DropTable
DROP TABLE IF EXISTS "OtpCode";

-- DropIndex
DROP INDEX IF EXISTS "User_phone_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN IF EXISTS "phoneVerified";
