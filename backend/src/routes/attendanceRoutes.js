import express from "express";

import {
  createAttendance,
  getAttendances,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
} from "../controllers/attendanceController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(authorize("admin", "manager", "teacher"));

router
  .route("/")
  .get(getAttendances)
  .post(createAttendance);

router
  .route("/:id")
  .get(getAttendanceById)
  .patch(updateAttendance)
  .delete(deleteAttendance);

export default router;