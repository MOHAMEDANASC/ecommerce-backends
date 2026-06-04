import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import bcrypt from "bcrypt";
import { registerSchema, loginSchema } from "../validations/authValidation";
import { ZodError } from "zod";
import { sendOTPEmail } from "../utils/sendEmail";
import jwt from "jsonwebtoken";

const createAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;

    const existingAdmin = await prisma.admin.findFirst();

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin already exists",
      });
    }   

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.admin.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin,
    });
  } catch (error) {
    next(error);
  }
};

const adminLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return res.status(444).json({
        success: false,
        message: "Admin not found",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        role: admin.role,
        type: "ADMIN",
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
    });
  } catch (error) {
    next(error);
  }
};

const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedData = registerSchema.parse(req.body);
    const { name, email, password, phone } = parsedData;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
      },
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors: error.issues,
      });
    }
    next(error);
  }
};

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedData = loginSchema.parse(req.body);
    const { email, password } = parsedData;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked by admin",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.otp.deleteMany({
      where: {
        userId: user.id,
      },
    });

    await prisma.otp.create({
    data: {
      userId: user.id,
      code: otp,
      type: "LOGIN",
      isUsed: false,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

    await sendOTPEmail(email, otp);

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors: error.issues,
      });
    }
    next(error);
  }
};

const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const otpRecord = await prisma.otp.findFirst({
      where: {
        userId: user.id,
        code: otp,
        isUsed: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const now = new Date();
    const otpAge = (now.getTime() - otpRecord.createdAt.getTime()) / 1000;

    if (otpAge > 300) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: {
        isUsed: true,
      },
    });

    const token = jwt.sign(
      {
        id: user.id,
        type: "USER",
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
    });
  } catch (error) {
    next(error);
  }
};

const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "No token provided",
      });
    }

    await prisma.blacklistedToken.create({
      data: { token },
    });

    res.clearCookie("token");

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If email exists, OTP sent",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.otp.create({
      data: {
        userId: user.id,
        code: otp,
        type: "FORGOT_PASSWORD",
        isUsed: false,
        expiresAt: expiry,
      },
    });

    await sendOTPEmail(email, otp);

    return res.status(200).json({
      success: true,
      message: "OTP sent",
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP and new password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(444).json({
        success: false,
        message: "User not found",
      });
    }

    const otpRecord = await prisma.otp.findFirst({
      where: {
        userId: user.id,
        code: otp,
        type: "FORGOT_PASSWORD",
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      prisma.otp.update({
        where: { id: otpRecord.id },
        data: {
          isUsed: true,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
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
      message: "User profile fetched successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createAdmin,
  adminLogin,
  registerUser,
  loginUser,
  verifyOTP,
  logoutUser,
  forgotPassword,
  resetPassword,
  getMe,
};