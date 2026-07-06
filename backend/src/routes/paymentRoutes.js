import express from "express";
import {
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  getPaymentStatistics,
  generatePaymentReceipt,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validateBody } from "../middleware/validate.js";
import {
  createPaymentSchema,
  updatePaymentSchema,
} from "../validators/schemas.js";

const router = express.Router();

router.use(protect);
router.use(authorize("admin", "manager"));

router.get("/statistics", getPaymentStatistics);
router.get("/:id/receipt", generatePaymentReceipt);

router
  .route("/")
  .get(getPayments)
  .post(validateBody(createPaymentSchema), createPayment);

router
  .route("/:id")
  .get(getPaymentById)
  .patch(validateBody(updatePaymentSchema), updatePayment)
  .put(validateBody(updatePaymentSchema), updatePayment)
  .delete(deletePayment);

export default router;
