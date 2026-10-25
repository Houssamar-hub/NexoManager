import express from "express";
import {
  register,
  login,
  getMe,
  changePassword,
  updateProfile,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateBody } from "../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from "../validators/schemas.js";

const router = express.Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.get("/me", protect, getMe);
router.put("/password", protect, validateBody(changePasswordSchema), changePassword);
router.put("/profile", protect, updateProfile);

export default router;
