import { Request, Response, NextFunction } from "express";
import { updateAdminSchema } from "../validations/adminValidation";
import prisma from "../config/prisma";
import bcrypt from "bcrypt";

const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = req.query.search as string;

    const users = await prisma.user.findMany({
      where: search
        ? {
            name: {
              contains: search,
              mode: "insensitive",
            },
          }
        : {},
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isBlocked: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      users,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        addresses: true,
        orders: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.params.id);
    const { name, email, phone, isBlocked  } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(isBlocked  !== undefined && { isBlocked  }),
      },
    });

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const updateAdminProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateAdminSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues,
      });
    }

    const { name, email, password } = parsed.data;
    const updateData: any = { name, email };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.admin.update({
      where: { id: req.user!.id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: "Admin profile updated successfully",
      admin: updated,
    });
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      revenueData,
      recentOrders,
      orderStatusStats,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: "DELIVERED" },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Dashboard statistics metrics loaded",
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: revenueData._sum.total || 0,
      },
      recentOrders,
      orderStatusStats,
    });
  } catch (error) {
    next(error);
  }
};

const getAdminProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user!.id;

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin profile data not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Admin profile fetched successfully",
      admin,
    });
  } catch (error) {
    next(error);
  }
};

const changeAdminPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Wrong current password",
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.admin.update({
      where: { id: adminId },
      data: { password: hashed },
    });

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

const globalSearch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query.q as string;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query required",
      });
    }

    const [users, products] = await Promise.all([
      prisma.user.findMany({
        where: {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        take: 5,
      }),
      prisma.product.findMany({
        where: {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        take: 5,
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Global search results loaded",
      results: {
        users,
        products,
      },
    });
  } catch (error) {
    next(error);
  }
};

const toggleUserBlock = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = Number(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isBlocked: !user.isBlocked,
      },
    });

    return res.status(200).json({
      success: true,
      message: updatedUser.isBlocked
        ? "User blocked successfully"
        : "User unblocked successfully",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  getDashboardStats,
  updateAdminProfile,
  getAdminProfile,
  changeAdminPassword,
  globalSearch,
  toggleUserBlock,
};