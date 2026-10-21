
import express from "express";

import {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
} from "../controllers/studentController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .get(getStudents)
  .post(createStudent);

router.route("/:id")
  .get(getStudentById)
  .patch(updateStudent)
  .delete(deleteStudent);

export default router;
