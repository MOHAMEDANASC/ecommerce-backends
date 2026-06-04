import { z } from "zod";

export const createOrderSchema = z
  .object({
    addressId: z.number(),

    productId: z.number().optional(),

    quantity: z.number().min(1).optional(),

    items: z
      .array(
        z.object({
          productId: z.number(),
          quantity: z.number().min(1),
        })
      )
      .optional(),
  })
  .refine((data) => !(data.productId && data.items), {
    message: "Use either productId or items, not both",
  });