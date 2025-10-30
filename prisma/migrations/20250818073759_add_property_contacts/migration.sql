/*
  Warnings:

  - You are about to drop the column `email` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `whatsapp` on the `Property` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Property" DROP COLUMN "email",
DROP COLUMN "phone",
DROP COLUMN "whatsapp",
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "contactWhatsapp" TEXT;
