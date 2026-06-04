import { Router } from "express";
import productadminController from "../controllers/productadminController";

import { adminAuthMiddleware, allowRoles } from "../middlewares/adminAuthMiddleware";
import { upload } from "../middlewares/uploadMiddleware"; 

const router = Router();

router.post("/",adminAuthMiddleware,allowRoles("SUPER_ADMIN", "ADMIN"),upload.array("images", 5),productadminController.createProduct);
router.patch("/:id",adminAuthMiddleware,allowRoles("SUPER_ADMIN", "ADMIN"),upload.array("images", 5),productadminController.updateProduct);
router.delete("/:id",adminAuthMiddleware,allowRoles("SUPER_ADMIN", "ADMIN"),productadminController.deleteProduct);
router.get("/all-product", adminAuthMiddleware,allowRoles("SUPER_ADMIN", "ADMIN","MANAGER"),productadminController.getAllProducts)
router.delete("/image/:id",adminAuthMiddleware,allowRoles("SUPER_ADMIN", "ADMIN"),productadminController.deleteProductImage);


export default router;