import { Router } from "express";
import deleteCategory from "../controllers/categoryadminController";
import { adminAuthMiddleware,allowRoles } from "../middlewares/adminAuthMiddleware";

const router = Router();

router.post("/",adminAuthMiddleware, allowRoles("SUPER_ADMIN", "ADMIN"), deleteCategory.createCategory);
router.put("/:id",adminAuthMiddleware, allowRoles("SUPER_ADMIN", "ADMIN"), deleteCategory.updateCategory);
router.delete("/:id",adminAuthMiddleware, allowRoles("SUPER_ADMIN", "ADMIN"), deleteCategory.deleteCategory);
router.get("/",adminAuthMiddleware,allowRoles("SUPER_ADMIN", "ADMIN"),deleteCategory.getAllCategories);

export default router;