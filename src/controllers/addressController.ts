import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { addressSchema } from "../validations/addressValidator";
import { ZodError } from "zod";


const addAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const parsedData = addressSchema.parse(req.body);
        const address = await prisma.address.create({
            data: {
                userId,
                ...parsedData,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Address added successfully",
            address,
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


const getAllAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const addresses = await prisma.address.findMany({
            where: { userId },
            orderBy: { id: "desc" },
        });

        return res.status(200).json({
            success: true,
            message: "Addresses fetched successfully",
            count: addresses.length,
            addresses,
        });

    } catch (error) {
        next(error);
    }
};


const updateAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const addressId = Number(req.params.id);

        if (isNaN(addressId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid address ID",
            });
        }

        const parsedData = addressSchema.partial().parse(req.body);

        const existingAddress = await prisma.address.findFirst({
            where: {
                id: addressId,
                userId,
            },
        });

        if (!existingAddress) {
            return res.status(404).json({
                success: false,
                message: "Address not found",
            });
        }

        const updatedAddress = await prisma.address.update({
            where: { id: addressId },
            data: parsedData,
        });

        return res.status(200).json({
            success: true,
            message: "Address updated successfully",
            address: updatedAddress,
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

export default {
    addAddress,
    getAllAddress,
    updateAddress,
};