import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import cloudinary from "../config/cloudinary";

const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin = req.user;

    if (!admin || !admin.id || admin.type !== "ADMIN") {
      return res.status(401).json({
        success: false,
        message: "Unauthorized (Admin only)",
      });
    }

    const {
      name,
      slug,
      description,
      shortDescription,
      price,
      comparePrice,
      brand,
      categoryId,
      sizes,
      features,
      status,
    } = req.body;

    if (!name || !slug || !description || price == null || !categoryId) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    if (isNaN(price) || Number(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid price",
      });
    }

    const existingSlug = await prisma.product.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      return res.status(400).json({
        success: false,
        message: "Slug already exists",
      });
    }

    const category = await prisma.category.findUnique({
      where: { id: Number(categoryId) },
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Invalid categoryId",
      });
    }

    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image required",
      });
    }

    const parsedSizes = sizes ? JSON.parse(sizes) : [];
    const parsedFeatures = features ? JSON.parse(features) : [];

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        shortDescription,
        price: Number(price),
        comparePrice: comparePrice ? Number(comparePrice) : null,
        brand,
        categoryId: category.id,
        adminId: admin.id,
        status: status || "DRAFT",
        images: {
          create: files.map((file: any) => {
            if (!file.path || !(file.public_id || file.filename)) {
              throw new Error("Invalid file upload data");
            }
            return {
              url: file.path,
              publicId: file.public_id || file.filename,
            };
          }),
        },
        sizes: {
          create: parsedSizes.map((s: any) => ({
            size: s.size,
            stock: Number(s.stock),
          })),
        },
        features: {
          create: parsedFeatures.map((f: any) => ({
            title: f.title,
            description: f.description || null,
          })),
        },
      },
      include: {
        category: true,
        images: true,
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = Number(req.params.id);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const {
      name,
      slug,
      description,
      shortDescription,
      price,
      comparePrice,
      brand,
      categoryId,
      sizes,
      features,
      isFeatured,
      status,
    } = req.body;

    if (slug) {
      const existingSlug = await prisma.product.findFirst({
        where: {
          slug,
          NOT: { id: productId },
        },
      });

      if (existingSlug) {
        return res.status(400).json({
          success: false,
          message: "Slug already exists",
        });
      }
    }

    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: Number(categoryId) },
      });

      if (!category) {
        return res.status(400).json({
          success: false,
          message: "Invalid categoryId",
        });
      }
    }

    const parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes || [];
    const parsedFeatures = typeof features === "string" ? JSON.parse(features) : features || [];

    await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        slug,
        description,
        shortDescription,
        price: price !== undefined ? Number(price) : undefined,
        comparePrice: comparePrice !== undefined ? Number(comparePrice) : undefined,
        brand,
        status,
        isFeatured: isFeatured !== undefined ? (isFeatured === "true" || isFeatured === true) : undefined,
        ...(categoryId && { categoryId: Number(categoryId) }),
        sizes: {
          deleteMany: {},
          create: parsedSizes.map((s: any) => ({
            size: s.size,
            stock: Number(s.stock),
          })),
        },
        features: {
          deleteMany: {},
          create: parsedFeatures.map((f: any) => ({
            title: f.title,
            description: f.description || null,
          })),
        },
      },
    });

    const files = req.files as Express.Multer.File[];

    if (files && files.length > 0) {
      await prisma.productImage.createMany({
        data: files.map((file: any) => ({
          url: file.path,
          publicId: file.public_id || file.filename,
          productId: productId,
        })),
      });
    }

    const finalProduct = await prisma.product.findUnique({
      where: { id: productId },
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

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: finalProduct,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = Number(req.params.id);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    for (const img of product.images) {
      await cloudinary.uploader.destroy(img.publicId);
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 9;
    const sort = req.query.sort as string;
    const search = (req.query.search as string) || "";
    const status = req.query.status as string;
    const skip = (page - 1) * limit;
    const orderBy: any = {};

    if (sort === "price_asc") {
      orderBy.price = "asc";
    } else if (sort === "price_desc") {
      orderBy.price = "desc";
    }else {
      orderBy.createdAt = "desc";
    }

    const filterClause: any = {
      name: {
        contains: search,
        mode: "insensitive" as const,
      },
    };

    if (status && status !== "ALL") {
      filterClause.status = status;
    }

    const products = await prisma.product.findMany({
      skip,
      take: limit,
      orderBy,
      where: filterClause,
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

    const totalProducts = await prisma.product.count({
      where: filterClause,
    });

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

const deleteProductImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const imageId = Number(req.params.id);

    if (isNaN(imageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid image ID",
      });
    }

    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    await cloudinary.uploader.destroy(image.publicId);

    await prisma.productImage.delete({
      where: { id: imageId },
    });

    return res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  deleteProductImage,
};