/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Listing` table. All the data in the column will be lost.
  - Added the required column `image` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roomType` to the `Listing` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "imageUrl",
DROP COLUMN "updatedAt",
ADD COLUMN     "electricity" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "image" TEXT NOT NULL,
ADD COLUMN     "roomType" TEXT NOT NULL,
ADD COLUMN     "water" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "wifi" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "price" SET DATA TYPE DOUBLE PRECISION;
