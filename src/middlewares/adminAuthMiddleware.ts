import { Request, Response, NextFunction } from "express";

import jwt, {
  JsonWebTokenError,
  TokenExpiredError,
} from "jsonwebtoken";

import prisma from "../config/prisma";

export const adminAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    let token: string | undefined;

    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const blacklisted = await prisma.blacklistedToken.findUnique({
      where: { token },
    });

    if (blacklisted) {
      return res.status(401).json({
        success: false,
        message: "Token is invalid (logged out)",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as {
      id: number;
      type: "ADMIN";
    };

    if (decoded.type !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Admin access only",
      });
    }

    const admin = await prisma.admin.findUnique({
      where: {
        id: decoded.id,
      },
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin not found",
      });
    }

    req.user = {
      id: admin.id,
      type: "ADMIN",
      name: admin.name,
      email: admin.email,
    };

    next();

  } catch (error) {

    if (error instanceof TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    if (error instanceof JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    next(error);
  }
};

export const allowRoles = (...roles: string[]) => {

  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userRole = user.type;

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    next();
  };
};

