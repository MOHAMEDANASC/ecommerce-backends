import { Router } from "express";
import addressController from "../controllers/addressController";
import { userAuthMiddleware } from "../middlewares/userAuthMiddleware";

const router = Router();

router.post("/", userAuthMiddleware, addressController.addAddress);
router.put("/:id", userAuthMiddleware, addressController.updateAddress);
router.get("/", userAuthMiddleware, addressController.getAllAddress);

export default router;