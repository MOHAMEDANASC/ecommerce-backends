import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";

const getCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: true,
                },
              },
            },
          },
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cart fetched successfully",
      cart,
    });
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { productId, quantity, selectedSize } = req.body;

    if (!productId || !quantity || !selectedSize) {
      return res.status(400).json({
        success: false,
        message: "ProductId, quantity and selectedSize are required",
      });
    }

    const product = await prisma.product.findUnique({
      where: {
        id: Number(productId),
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const productSize = await prisma.productSize.findFirst({
      where: {
        productId: Number(productId),
        size: selectedSize,
      },
    });

    if (!productSize) {
      return res.status(404).json({
        success: false,
        message: "Selected size not found",
      });
    }

    if (productSize.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: "Not enough stock available for this size",
      });
    }

    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: Number(productId),
        selectedSize,
      },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: {
          id: existingItem.id,
        },
        data: {
          quantity: existingItem.quantity + Number(quantity),
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: Number(productId),
          quantity: Number(quantity),
          selectedSize,
        },
      });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: {
        id: cart.id,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Product added to cart successfully",
      cart: updatedCart,
    });
  } catch (error) {
    next(error);
  }
};

const updateCartItemQuantity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const productId = Number(req.params.productId);
    const { selectedSize, quantity } = req.body;

    if (!selectedSize || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "ProductId, selectedSize and quantity are required",
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const product = await prisma.product.findUnique({
      where: {
        id: Number(productId),
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const productSize = await prisma.productSize.findFirst({
      where: {
        productId: Number(productId),
        size: selectedSize,
      },
    });

    if (!productSize) {
      return res.status(404).json({
        success: false,
        message: "Product size variant not found",
      });
    }

    if (productSize.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: "Not enough stock available for this size",
      });
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: Number(productId),
        selectedSize,
      },
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    const updatedItem = await prisma.cartItem.update({
      where: {
        id: cartItem.id,
      },
      data: {
        quantity,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Cart item quantity updated successfully",
      item: updatedItem,
    });
  } catch (error) {
    next(error);
  }
};

const removeCartItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const productId = Number(req.params.productId);
    const { selectedSize } = req.body;

    if (!selectedSize) {
      return res.status(400).json({
        success: false,
        message: "ProductId and selectedSize are required",
      });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: Number(productId),
        selectedSize,
      },
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    await prisma.cartItem.delete({
      where: {
        id: cartItem.id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Item removed from cart successfully",
    });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const itemsCount = await prisma.cartItem.count({
      where: {
        cartId: cart.id,
      },
    });

    if (itemsCount === 0) {
      return res.status(200).json({
        success: true,
        message: "Cart is already empty",
      });
    }

    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
};