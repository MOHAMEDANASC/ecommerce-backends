-- AlterTable
ALTER TABLE "User" ADD COLUMN     "forgotOtp" TEXT,
ADD COLUMN     "forgotOtpExpiry" TIMESTAMP(3);
