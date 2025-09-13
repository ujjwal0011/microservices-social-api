import express from "express";
import { validateRequest, updateUserSchema } from "../utils/validation.js";
import {
  getUserProfile,
  searchUsers,
  updateUserProfile,
} from "../controllers/user.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", service: "user-service" });
});

router.get("/search", searchUsers);

router.put(
  "/profile",
  authenticateToken,
  validateRequest(updateUserSchema),
  updateUserProfile
);

router.get("/:userId/profile", getUserProfile);

export default router;
