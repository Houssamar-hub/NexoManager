import express from "express";
import { getDashboardStatistics } from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(authorize("admin", "manager"));

router.get("/", getDashboardStatistics);
router.get("/statistics", getDashboardStatistics);

export default router;
