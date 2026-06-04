import { z } from "zod";

const sizeSchema = z.object({
  size: z.string().min(1, "Size is required"),
  stock: z.coerce.number().int().nonnegative(),
});

export const createProductSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(8, "Description too short"),
  price: z.coerce.number().positive("Price must be positive"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  sizes: z.array(sizeSchema).min(1, "At least one size required"),
  categoryId: z.coerce.number()
});

export const updateProductSchema = createProductSchema.partial();