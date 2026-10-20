import express from "express";

import {
  createNotification,
  getNotifications,
  getNotificationById,
  markNotificationAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getNotifications)
  .post(authorize("admin", "manager"), createNotification);

router.patch("/:id/read", markNotificationAsRead);

router
  .route("/:id")
  .get(getNotificationById)
  .delete(deleteNotification);

export default router;