
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

const router = express.Router();

router.use(protect);

router.use(authorize("admin", "manager"));

router.route("/")
  .get(getTeachers)
  
  .post(createTeacher);


router.route("/:id")
  .get(getTeacherById)

  .patch(updateTeacher)

  .delete(deleteTeacher);

export default router;
