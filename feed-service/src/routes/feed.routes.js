import express from "express";
import { handleGetFeed } from "../controllers/feed.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "feed-service",
  });
});

router.get("/", authenticateToken, handleGetFeed);

export default router;
