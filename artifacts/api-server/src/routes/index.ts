import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import productsRouter from "./products.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);

export default router;
