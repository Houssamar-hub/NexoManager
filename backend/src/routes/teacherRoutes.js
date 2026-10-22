
import express from "express";

import {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
} from "../controllers/teacherController.js";


const router = express.Router();

router.use(protect);

router.use(authorize("admin", "manager"));

router.route("/")
 

router.route("/:id")
  .get(getTeacherById)

  .patch(updateTeacher)

  .delete(deleteTeacher);

export default router;
