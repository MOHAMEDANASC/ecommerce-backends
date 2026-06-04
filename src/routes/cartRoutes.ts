import { Router } from "express";
import cartController from "../controllers/cartController";
import { userAuthMiddleware } from "../middlewares/userAuthMiddleware";


const router = Router();

router.get("/",userAuthMiddleware, cartController.getCart);
router.post("/",userAuthMiddleware, cartController.addToCart);
router.put("/:productId",userAuthMiddleware, cartController.updateCartItemQuantity);
router.delete("/:productId",userAuthMiddleware, cartController.removeCartItem);
router.delete("/",userAuthMiddleware, cartController.clearCart);

export default router;