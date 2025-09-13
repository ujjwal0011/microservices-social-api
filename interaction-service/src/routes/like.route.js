import express from "express";
import {
  handleLikePost,
  handleUnlikePost,
  handleGetPostLikes,
  handleGetLikeCount,
} from "../controllers/like.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/post/:postId/count", handleGetLikeCount);

router.get("/post/:postId", handleGetPostLikes);

router.post("/post/:postId", authenticateToken, handleLikePost);

router.delete("/post/:postId", authenticateToken, handleUnlikePost);
