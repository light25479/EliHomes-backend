/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Bill` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Bill` table. All the data in the column will be lost.
  - You are about to drop the column `available` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `electricity` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `water` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `wifi` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `RentPayment` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `RentPayment` table. All the data in the column will be lost.
  - You are about to drop the column `paid` on the `RentPayment` table. All the data in the column will be lost.
  - Added the required column `description` to the `Bill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Made the column `paidAt` on table `RentPayment` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Property" DROP CONSTRAINT "Property_ownerId_fkey";

-- AlterTable
ALTER TABLE "Bill" DROP COLUMN "createdAt",
DROP COLUMN "type",
ADD COLUMN     "description" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "available",
DROP COLUMN "electricity",
DROP COLUMN "water",
DROP COLUMN "wifi",
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "utilities" TEXT[],
ALTER COLUMN "ownerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "RentPayment" DROP COLUMN "createdAt",
DROP COLUMN "dueDate",
DROP COLUMN "paid",
ALTER COLUMN "paidAt" SET NOT NULL,
ALTER COLUMN "paidAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
