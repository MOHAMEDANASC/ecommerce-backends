import { Request, Response, NextFunction } from "express";

import jwt, {
  JsonWebTokenError,
  TokenExpiredError,
} from "jsonwebtoken";

import prisma from "../config/prisma";

export const userAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    let token: string | undefined;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {

      const parts = authHeader.split(" ");

      if (parts.length === 2) {
        token = parts[1];
      }
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
      type: "USER";
    };

    if (decoded.type !== "USER") {
      return res.status(403).json({
        success: false,
        message: "User access only",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = {
      id: user.id,
      type: "USER",
      name: user.name,
      email: user.email,
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
