/*
  Warnings:

  - You are about to drop the column `amountPaid` on the `BillPayment` table. All the data in the column will be lost.
  - Added the required column `amount` to the `BillPayment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `billType` to the `BillPayment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `propertyId` to the `BillPayment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `BillPayment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `BillPayment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "BillPayment" DROP CONSTRAINT "BillPayment_billId_fkey";

-- AlterTable
ALTER TABLE "BillPayment" DROP COLUMN "amountPaid",
ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "billType" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "destinationAccount" TEXT,
ADD COLUMN     "propertyId" INTEGER NOT NULL,
ADD COLUMN     "serviceChargeAccount" TEXT,
ADD COLUMN     "status" TEXT DEFAULT 'pending',
ADD COLUMN     "totalAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" INTEGER,
ALTER COLUMN "billId" DROP NOT NULL,
ALTER COLUMN "paidAt" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "BillPayment" ADD CONSTRAINT "BillPayment_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillPayment" ADD CONSTRAINT "BillPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillPayment" ADD CONSTRAINT "BillPayment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE SET NULL ON UPDATE CASCADE;
