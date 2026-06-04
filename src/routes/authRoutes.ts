import { Router } from "express";
import authController from "../controllers/authController";
import { protect } from "../middlewares/authMiddleware";

const router = Router();

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/verify-otp", authController.verifyOTP);
router.post("/reset-password", authController.resetPassword);
router.post("/forgot-password", authController.forgotPassword);
router.post("/logout", protect, authController.logoutUser);
router.get("/me", protect, authController.getMe);

export default router;