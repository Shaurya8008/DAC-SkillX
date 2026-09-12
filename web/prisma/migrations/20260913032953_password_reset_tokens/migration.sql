-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "resetTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "resetTokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Profile_resetTokenHash_key" ON "Profile"("resetTokenHash");
