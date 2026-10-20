
import express from "express";
import {
  getMyCenter,
  updateMyCenter,
} from "../controllers/centerController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/me", getMyCenter);
router.patch("/me", updateMyCenter);

export default router;
