import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import productsRouter from "./products.js";
import eventsRouter from "./events.js";
import materialsRouter from "./materials.js";
import albumsRouter from "./albums.js";
import adminRouter from "./admin.js";
import storageRouter from "./storage.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(eventsRouter);
router.use(materialsRouter);
router.use(albumsRouter);
router.use(adminRouter);
router.use(storageRouter);

export default router;
