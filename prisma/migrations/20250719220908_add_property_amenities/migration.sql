/*
  Warnings:

  - You are about to drop the column `isAvailable` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `utilities` on the `Property` table. All the data in the column will be lost.
  - You are about to alter the column `price` on the `Property` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Property" DROP COLUMN "isAvailable",
DROP COLUMN "utilities",
ADD COLUMN     "electricity" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "size" INTEGER,
ADD COLUMN     "water" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "wifi" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "price" SET DATA TYPE INTEGER;
