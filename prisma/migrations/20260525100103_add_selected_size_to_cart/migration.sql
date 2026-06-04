/*
  Warnings:

  - You are about to drop the `otp` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[cartId,productId,selectedSize]` on the table `CartItem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `selectedSize` to the `CartItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "CartItem_cartId_productId_key";

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "selectedSize" TEXT NOT NULL;

-- DropTable
DROP TABLE "otp";

-- CreateTable
CREATE TABLE "Otp" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_selectedSize_key" ON "CartItem"("cartId", "productId", "selectedSize");
