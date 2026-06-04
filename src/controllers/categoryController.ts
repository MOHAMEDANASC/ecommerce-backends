import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";

const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany();

    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      categories,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getAllCategories,
};