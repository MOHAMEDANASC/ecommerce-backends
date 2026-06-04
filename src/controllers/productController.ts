import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";

const getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const products = await prisma.product.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        category: true,
        images: true,
        sizes: true,
        features: true,
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const totalProducts = await prisma.product.count();

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      products,
      pagination: {
        total: totalProducts,
        page,
        limit,
        totalPages: Math.ceil(totalProducts / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getSingleProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: true,
        sizes: true,
        features: true,
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      product,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getAllProducts,
  getSingleProduct,
};