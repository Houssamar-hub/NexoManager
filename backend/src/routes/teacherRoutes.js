import express from "express";
import {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
} from "../controllers/teacherController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validateBody } from "../middleware/validate.js";
import {
  createTeacherSchema,
  updateTeacherSchema,
} from "../validators/schemas.js";

const router = express.Router();

router.use(protect);
router.use(authorize("admin", "manager"));

router
  .route("/")
  .get(getTeachers)
  .post(validateBody(createTeacherSchema), createTeacher);

router
  .route("/:id")
  .get(getTeacherById)
  .patch(validateBody(updateTeacherSchema), updateTeacher)
  .put(validateBody(updateTeacherSchema), updateTeacher)
  .delete(deleteTeacher);

export default router;
