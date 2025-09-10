import express from "express";
import {
  validateRequest,
  userRegistrationSchema,
  userLoginSchema,
} from "../utils/validation.js";
import {
  register,
  login,
  getMyProfile,
} from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", validateRequest(userRegistrationSchema), register);

router.post("/login", validateRequest(userLoginSchema), login);

router.get("/profile", authenticateToken, getMyProfile);

export default router;
