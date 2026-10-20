
import express from "express";

import {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  addStudentToGroup,
  removeStudentFromGroup,
  deleteGroup,
} from "../controllers/groupController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .get(getGroups)
  .post(createGroup);

router.route("/:id")
  .get(getGroupById)
  .patch(updateGroup)
  .delete(deleteGroup);

router.post("/:id/students", addStudentToGroup);
router.delete("/:id/students", removeStudentFromGroup);

export default router;
