/*
  Warnings:

  - You are about to drop the column `method` on the `RentPayment` table. All the data in the column will be lost.
  - Added the required column `paymentMethod` to the `RentPayment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `RentPayment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `RentPayment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "RentPayment" DROP CONSTRAINT "RentPayment_agentId_fkey";

-- AlterTable
ALTER TABLE "RentPayment" DROP COLUMN "method",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "destinationAccount" TEXT,
ADD COLUMN     "paymentMethod" TEXT NOT NULL,
ADD COLUMN     "serviceChargeAccount" TEXT,
ADD COLUMN     "status" TEXT DEFAULT 'pending',
ADD COLUMN     "totalAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "paidAt" DROP NOT NULL,
ALTER COLUMN "agentId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "RentPayment" ADD CONSTRAINT "RentPayment_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
