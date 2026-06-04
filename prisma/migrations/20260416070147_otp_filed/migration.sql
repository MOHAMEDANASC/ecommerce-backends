/*
  Warnings:

  - You are about to drop the column `forgotOtp` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `forgotOtpExpiry` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `otp` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `otpExpiry` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `otpVerified` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "forgotOtp",
DROP COLUMN "forgotOtpExpiry",
DROP COLUMN "otp",
DROP COLUMN "otpExpiry",
DROP COLUMN "otpVerified";

-- CreateTable
CREATE TABLE "otp" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "User" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "otp_pkey" PRIMARY KEY ("id")
);
