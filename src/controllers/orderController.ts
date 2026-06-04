import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";

const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { addressId, productId, quantity = 1, selectedSize, items } = req.body;

    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: "Address is required",
      });
    }

    if (productId && items) {
      return res.status(400).json({
        success: false,
        message: "Use either productId or items",
      });
    }

    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Invalid address",
      });
    }

    let orderItems: any[] = [];
    let total = 0;

    if (productId) {
      if (!selectedSize) {
        return res.status(400).json({
          success: false,
          message: "Size is required",
        });
      }

      const product = await prisma.product.findUnique({
        where: {
          id: productId,
        },
        include: {
          sizes: true,
        },
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      const sizeData = product.sizes.find((s) => s.size === selectedSize);

      if (!sizeData) {
        return res.status(400).json({
          success: false,
          message: "Invalid size selected",
        });
      }

      if (sizeData.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${sizeData.stock} items available in size ${selectedSize}`,
        });
      }

      orderItems.push({
        productId: product.id,
        quantity,
        price: product.price,
        selectedSize,
      });

      total += Number(product.price) * quantity;
    } 
    else if (items && items.length > 0) {
      const productIds = items.map((i: any) => i.productId);
      const products = await prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
        },
        include: {
          sizes: true,
        },
      });

      for (const item of items) {
        const product = products.find((p) => p.id === item.productId);

        if (!product) {
          return res.status(404).json({
            success: false,
            message: "Product not found",
          });
        }

        const sizeData = product.sizes.find((s) => s.size === item.selectedSize);

        if (!sizeData) {
          return res.status(400).json({
            success: false,
            message: `Invalid size for ${product.name}`,
          });
        }

        if (sizeData.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Not enough stock for ${product.name} size ${item.selectedSize}`,
          });
        }

        orderItems.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
          selectedSize: item.selectedSize,
        });

        total += Number(product.price) * item.quantity;
      }
    } 
    else {
      const cart = await prisma.cart.findUnique({
        where: {
          userId,
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  sizes: true,
                },
              },
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Cart is empty",
        });
      }

      for (const item of cart.items) {
        const sizeData = item.product.sizes.find((s) => s.size === item.selectedSize);

        if (!sizeData) {
          return res.status(400).json({
            success: false,
            message: `Invalid size for ${item.product.name}`,
          });
        }

        if (sizeData.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Not enough stock for ${item.product.name}`,
          });
        }

        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
          selectedSize: item.selectedSize,
        });

        total += Number(item.product.price) * item.quantity;
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          addressId,
          total,
          status: "PENDING",
          items: {
            create: orderItems,
          },
        },
        include: {
          items: true,
          address: true,
        },
      });

      if (items && items.length > 0) {
        await tx.cartItem.deleteMany({
          where: {
            productId: {
              in: items.map((i: any) => i.productId),
            },
            cart: {
              userId,
            },
          },
        });
      } else if (!productId) {
        const cart = await tx.cart.findUnique({
          where: {
            userId,
          },
        });

        if (cart) {
          await tx.cartItem.deleteMany({
            where: {
              cartId: cart.id,
            },
          });
        }
      }

      for (const item of orderItems) {
        const updated = await tx.productSize.updateMany({
          where: {
            productId: item.productId,
            size: item.selectedSize,
            stock: {
              gte: item.quantity,
            },
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        if (updated.count === 0) {
          throw new Error("Stock update failed");
        }
      }

      return newOrder;
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};

const getUserOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      orders,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const orderId = Number(req.params.id);

    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const orderId = Number(req.params.id);

    if (isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!["PENDING", "PAID"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled at this stage",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
        },
      });

      for (const item of order.items) {
        await tx.productSize.updateMany({
          where: {
            productId: item.productId,
            size: item.selectedSize,
          },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }
    });

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createOrder,
  getUserOrders,
  getSingleOrder,
  cancelOrder,
};