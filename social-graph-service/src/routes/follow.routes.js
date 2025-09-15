import express from "express";
import {
  handleFollow,
  handleUnfollow,
  handleGetFollowing,
  handleGetFollowers,
  handleGetFollowingCount,
  handleGetFollowerCount,
} from "../controllers/follow.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "social-graph-service",
  });
});

router.get("/users/:userId/following/count", handleGetFollowingCount);

router.get("/users/:userId/followers/count", handleGetFollowerCount);

router.get("/users/:userId/following", handleGetFollowing);

router.get("/users/:userId/followers", handleGetFollowers);

router.post("/users/:userId/follow", authenticateToken, handleFollow);

router.delete("/users/:userId/follow", authenticateToken, handleUnfollow);

export default router;
