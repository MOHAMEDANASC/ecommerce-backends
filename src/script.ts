import prisma from "./config/prisma";
import bcrypt from "bcrypt";
import readlineSync from "readline-sync";
import { adminCreateSchema } from "./validations/adminValidation";

async function createAdmin() {
  try {
    const existingAdmin = await prisma.admin.findFirst();

    if (existingAdmin) {
      console.log(" Admin already exists. Delete it first if you want to recreate.");
      return;
    }

    const email = readlineSync.question("Enter admin email: ");

    const password = readlineSync.question("Enter admin password: ", {
      hideEchoBack: true, 
    });

    const parsed = adminCreateSchema.safeParse({ email, password });

    if (!parsed.success) {
      console.log(parsed.error.format());
      return;
    }

    const { email: validEmail, password: validPassword } = parsed.data;

    const hashedPassword = await bcrypt.hash(validPassword, 10);

    const admin = await prisma.admin.create({
      data: {
        name: "Super Admin",
        email: validEmail,
        password: hashedPassword,
        role: "SUPER_ADMIN",
      },
    });

    console.log(" Admin created successfully:");
    console.log({
      id: admin.id,
      email: admin.email,
      role: admin.role,
    });

  } catch (error) {
    console.error(" Error creating admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();