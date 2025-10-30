/*
  Warnings:

  - You are about to drop the column `image` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the `PropertyMedia` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PropertyMedia" DROP CONSTRAINT "PropertyMedia_propertyId_fkey";

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "image";

-- DropTable
DROP TABLE "PropertyMedia";

-- CreateTable
CREATE TABLE "PropertyImage" (
    "id" SERIAL NOT NULL,
    "base64Data" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PropertyImage" ADD CONSTRAINT "PropertyImage_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
