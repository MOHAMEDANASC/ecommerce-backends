import express from "express";
import adminController from "../controllers/adminController";
import authController from "../controllers/authController";
import {adminAuthMiddleware, allowRoles, } from "../middlewares/adminAuthMiddleware";

const router = express.Router();

router.post("/login", authController.adminLogin);

/* ================= USERS ================= */

router.get("/users",adminAuthMiddleware,allowRoles("SUPER_ADMIN", "ADMIN"),adminController.getAllUsers);
router.get("/users/:id",adminAuthMiddleware,allowRoles("SUPER_ADMIN", "ADMIN"),adminController.getSingleUser);
router.put("/users/:id",adminAuthMiddleware,allowRoles("SUPER_ADMIN", "ADMIN"),adminController.updateUser);
router.delete("/users/:id",adminAuthMiddleware,allowRoles("SUPER_ADMIN", "ADMIN"),adminController.deleteUser);
router.patch("/users/:id/block",adminAuthMiddleware,allowRoles("SUPER_ADMIN", "ADMIN"),adminController.toggleUserBlock);

/* ================= DASHBOARD ================= */

router.get("/dashboard",adminAuthMiddleware,allowRoles("SUPER_ADMIN", "ADMIN", "MANAGER", "SALES_MANAGER"),adminController.getDashboardStats);

/* ================= PROFILE ================= */

router.get("/profile",adminAuthMiddleware,adminController.getAdminProfile);
router.put("/change-password",adminAuthMiddleware,adminController.changeAdminPassword);
router.put("/update-profile",adminAuthMiddleware,adminController.updateAdminProfile);
router.get("/search", adminController.globalSearch);

export default router;