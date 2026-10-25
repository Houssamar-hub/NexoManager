import express from "express";
import {
  createAttendance,
  recordBulkAttendance,
  getAttendances,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
  getAttendanceStatistics,
} from "../controllers/attendanceController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validateBody } from "../middleware/validate.js";
import {
  createAttendanceSchema,
  bulkAttendanceSchema,
} from "../validators/schemas.js";

const router = express.Router();

router.use(protect);
router.use(authorize("admin", "manager", "teacher"));

router.get("/statistics", getAttendanceStatistics);
router.post("/bulk", validateBody(bulkAttendanceSchema), recordBulkAttendance);

router
  .route("/")
  .get(getAttendances)
  .post(validateBody(createAttendanceSchema), createAttendance);

router
  .route("/:id")
  .get(getAttendanceById)
  .patch(updateAttendance)
  .put(updateAttendance)
  .delete(deleteAttendance);

export default router;
