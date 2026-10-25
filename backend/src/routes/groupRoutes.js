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
import { authorize } from "../middleware/roleMiddleware.js";
import { validateBody } from "../middleware/validate.js";
import {
  createGroupSchema,
  updateGroupSchema,
} from "../validators/schemas.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getGroups)
  .post(
    authorize("admin", "manager"),
    validateBody(createGroupSchema),
    createGroup
  );

router
  .route("/:id")
  .get(getGroupById)
  .patch(
    authorize("admin", "manager"),
    validateBody(updateGroupSchema),
    updateGroup
  )
  .put(
    authorize("admin", "manager"),
    validateBody(updateGroupSchema),
    updateGroup
  )
  .delete(authorize("admin", "manager"), deleteGroup);

router.post(
  "/:id/students",
  authorize("admin", "manager"),
  addStudentToGroup
);

router.delete(
  "/:id/students",
  authorize("admin", "manager"),
  removeStudentFromGroup
);

export default router;
