import express from "express";

import {
  exportStudentsExcel,
  exportStudentsPDF,
  exportAttendanceExcel,
  exportAttendancePDF,
  exportPaymentsExcel,
  exportPaymentsPDF,
} from "../controllers/reportController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(authorize("admin", "manager"));

router.get("/students/excel", exportStudentsExcel);
router.get("/students/pdf", exportStudentsPDF);

router.get("/attendance/excel", exportAttendanceExcel);
router.get("/attendance/pdf", exportAttendancePDF);

router.get("/payments/excel", exportPaymentsExcel);
router.get("/payments/pdf", exportPaymentsPDF);

export default router;
