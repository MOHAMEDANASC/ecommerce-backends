import { Router } from "express";

import orderadminController from "../controllers/orderadminController";

import { adminAuthMiddleware, allowRoles } from "../middlewares/adminAuthMiddleware";


const router = Router();

router.put("/:id/status",adminAuthMiddleware,allowRoles("SUPER_ADMIN","SALES_MANAGER", "ADMIN"),orderadminController.updateOrderStatus);
router.get("/",adminAuthMiddleware,allowRoles("SUPER_ADMIN", "SALES_MANAGER", "ADMIN"),orderadminController.getAllOrders);


export default router;