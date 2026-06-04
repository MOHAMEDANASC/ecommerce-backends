import { Router } from "express";

import orderController from "../controllers/orderController";
import { userAuthMiddleware } from "../middlewares/userAuthMiddleware";

const router = Router();

router.post("/", userAuthMiddleware, orderController.createOrder);
router.get("/",userAuthMiddleware, orderController.getUserOrders);
router.get("/:id",userAuthMiddleware, orderController.getSingleOrder);
router.patch("/:id/cancel",userAuthMiddleware, orderController.cancelOrder);

export default router;