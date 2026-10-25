import express from "express";
import {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
} from "../controllers/studentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validateBody } from "../middleware/validate.js";
import {
  createStudentSchema,
  updateStudentSchema,
} from "../validators/schemas.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getStudents)
  .post(
    authorize("admin", "manager"),
    validateBody(createStudentSchema),
    createStudent
  );

router
  .route("/:id")
  .get(getStudentById)
  .patch(
    authorize("admin", "manager"),
    validateBody(updateStudentSchema),
    updateStudent
  )
  .put(
    authorize("admin", "manager"),
    validateBody(updateStudentSchema),
    updateStudent
  )
  .delete(authorize("admin", "manager"), deleteStudent);

export default router;
