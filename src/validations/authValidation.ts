import { z } from "zod";


export const registerSchema = z.object({
    name : z.string().min(1, "Name is required"),

    email : z.string().email("Invalid email format"),

    password : z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one  number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Must contain at least one special character"),

    phone : z.string().regex(/^[0-9]{10}$/, "Phone must be exactly 10 digits")
})


export const loginSchema = z.object({
    email : z.string().email("invalied email"),

    password : z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one  number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Must contain at least one special character")
})
