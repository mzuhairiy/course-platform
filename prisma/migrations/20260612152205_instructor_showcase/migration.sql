-- AlterTable
ALTER TABLE "User" ADD COLUMN     "expertiseId" TEXT,
ADD COLUMN     "headline" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_expertiseId_fkey" FOREIGN KEY ("expertiseId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
