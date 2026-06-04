import { z } from "zod";

export const addressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  street: z.string().min(3, "Street is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zip: z.string()
    .min(4, "ZIP too short")
    .max(9, "ZIP too long")
    .regex(/^[0-9]+$/, "ZIP must be numeric"),
  country: z.string().min(2, "Country is required"),
});