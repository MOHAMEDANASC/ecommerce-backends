import prisma from "./config/prisma";
import bcrypt from "bcrypt";

async function resetAdminPassword() {
  try {
    const email = "admin@gmail.com";
    const newPassword = "Admin@123";

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedAdmin = await prisma.admin.update({
      where: { email },
      data: { password: hashedPassword },
    });

    console.log("✅ Password updated successfully");
    console.log({
      email: updatedAdmin.email,
    });
  } catch (error) {
    console.error("❌ Error updating password:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();