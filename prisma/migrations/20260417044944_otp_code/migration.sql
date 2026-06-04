/*
  Warnings:

  - Added the required column `code` to the `otp` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "otp" ADD COLUMN     "code" TEXT NOT NULL;
