import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

import prisma from "./config/prisma";
import errorMiddleware from "./middlewares/errorMiddleware";
import authRoutes from "./routes/authRoutes";

import adminRoutes from "./routes/adminRoutes";
import productAdminRoutes from "./routes/productadminRoutes";
import categoryAdminRoutes from "./routes/categoryadminRoutes";
import orderAdminRoutes from "./routes/orderadminRoutes";

import productRoutes from "./routes/productRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import cartRoutes from "./routes/cartRoutes";
import orderRoutes from "./routes/orderRoutes";
import addressRoutes from "./routes/addressRoutes";


dotenv.config();
const app = express();


app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`REQUEST: ${req.method} ${req.originalUrl}`);
  next();
});


app.use("/api/auth", authRoutes);

// USER
app.use("/api/address", addressRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

//  ADMIN 
app.use("/api/admin", adminRoutes);
app.use("/api/admin/products", productAdminRoutes);
app.use("/api/admin/categories", categoryAdminRoutes);
app.use("/api/admin/orders", orderAdminRoutes);


app.get("/", (req: Request, res: Response) => {
  res.status(200).send("SERVER WORKING");
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});


app.use(errorMiddleware);

async function testDB() {
  try {
    const users = await prisma.user.count();

    console.log("✅ Database Connected");
    console.log("👤 Users Count:", users);
  } catch (error) {
    console.error("❌ Database Connection Failed:", error);
  }
}

testDB();

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});