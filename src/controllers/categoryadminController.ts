import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";

const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const existingCategory = await prisma.category.findUnique({
      where: { name },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const categoryId = Number(id);

    if (isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: { name },
    });

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const categoryId = Number(id);

    if (isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // 1. Find all products associated with this category
    const products = await prisma.product.findMany({
      where: { categoryId },
      select: { id: true },
    });
    
    const productIds = products.map((p) => p.id);

    if (productIds.length > 0) {
      // 2. Delete all CartItems associated with these products
      await prisma.cartItem.deleteMany({
        where: { productId: { in: productIds } },
      });

      // 3. Delete all OrderItems associated with these products
      await prisma.orderItem.deleteMany({
        where: { productId: { in: productIds } },
      });

      // 4. Delete all products in this category
      await prisma.product.deleteMany({
        where: { id: { in: productIds } },
      });
    }

    // 5. Finally, delete the category
    const deletedCategory = await prisma.category.delete({
      where: { id: categoryId },
    });

    return res.status(200).json({
      success: true,
      message: "Category and associated items deleted successfully",
      category: deletedCategory,
    });
  } catch (error) {
    next(error);
  }
};

const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { id: "desc" },
    });

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
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
};