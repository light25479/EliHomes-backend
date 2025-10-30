/*
  Warnings:

  - Added the required column `method` to the `RentPayment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceCharge` to the `RentPayment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RentPayment" ADD COLUMN     "method" TEXT NOT NULL,
ADD COLUMN     "serviceCharge" DOUBLE PRECISION NOT NULL;
