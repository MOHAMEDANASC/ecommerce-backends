import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

const errorMiddleware = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {

  console.error(error);

  if (error instanceof ZodError) {
    return res.status(422).json({
      success: false,
      message: error.issues[0].message,
      errors: error.issues,
    });
  }

  return res.status(500).json({
    success: false,
    message: error.message || "Internal Server Error",
  });
};

export default errorMiddleware;