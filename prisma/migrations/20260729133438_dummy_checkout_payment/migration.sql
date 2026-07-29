/*
  Warnings:

  - You are about to drop the column `midtransResponse` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `midtransToken` on the `Transaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "midtransResponse",
DROP COLUMN "midtransToken",
ADD COLUMN     "paymentPayload" JSONB;
