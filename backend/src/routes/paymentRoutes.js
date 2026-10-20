import express from "express";

import {
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  getPaymentStatistics,
} from "../controllers/paymentController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(authorize("admin", "manager"));

router
  .route("/")
  .get(getPayments)
  .post(createPayment);
  
router.get("/statistics", getPaymentStatistics);

router
  .route("/:id")
  .get(getPaymentById)
  .patch(updatePayment)
  .delete(deletePayment);

export default router;