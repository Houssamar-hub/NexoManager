import express from "express";
import {
  getMyCenter,
  updateMyCenter,
} from "../controllers/centerController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validateBody } from "../middleware/validate.js";
import { updateCenterSchema } from "../validators/schemas.js";

const router = express.Router();

router.use(protect);

router.get("/me", getMyCenter);
router.patch("/me", authorize("admin", "manager"), validateBody(updateCenterSchema), updateMyCenter);
router.put("/me", authorize("admin", "manager"), validateBody(updateCenterSchema), updateMyCenter);

export default router;
