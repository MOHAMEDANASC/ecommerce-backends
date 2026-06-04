import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";

const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const status = req.query.status as string;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      skip,
      take: limit,
      where,
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalOrders = await prisma.order.count({ where });

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      orders,
      pagination: {
        total: totalOrders,
        page,
        limit,
        totalPages: Math.ceil(totalOrders / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderId = Number(req.params.id);
    const { status } = req.body;

    const allowedStatus = ["PENDING", "SHIPPED", "DELIVERED", "CANCELLED"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  updateOrderStatus,
  getAllOrders,
};