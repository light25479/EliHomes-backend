/*
  Warnings:

  - You are about to drop the column `base64Data` on the `PropertyImage` table. All the data in the column will be lost.
  - You are about to drop the column `mimeType` on the `PropertyImage` table. All the data in the column will be lost.
  - Added the required column `publicId` to the `PropertyImage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resourceType` to the `PropertyImage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `PropertyImage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PropertyImage" DROP COLUMN "base64Data",
DROP COLUMN "mimeType",
ADD COLUMN     "publicId" TEXT NOT NULL,
ADD COLUMN     "resourceType" TEXT NOT NULL,
ADD COLUMN     "url" TEXT NOT NULL;
