import { Router, type IRouter } from "express";
import healthRouter from "./health";
import driveRouter from "./drive";
import pdfRouter from "./pdf";

const router: IRouter = Router();

router.use(healthRouter);
router.use(driveRouter);
router.use(pdfRouter);

export default router;
