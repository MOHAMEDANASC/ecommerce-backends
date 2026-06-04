/*
  Warnings:

  - Added the required column `expiresAt` to the `Otp` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Otp` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Otp" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL;
