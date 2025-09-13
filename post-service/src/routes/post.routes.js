import express from "express";
import { query } from "../utils/database.js";
import {
  handleCreatePost,
  handleGetPostById,
  handleGetUserPosts,
  handleUpdatePost,
  handleDeletePost,
  handleSearchPosts,
} from "../controllers/post.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import {
  validateRequest,
  createPostSchema,
  updatePostSchema,
} from "../utils/validation.js";

const router = express.Router();

router.get("/search", handleSearchPosts);

router.get("/user/:userId", handleGetUserPosts);

router.post(
  "/",
  authenticateToken,
  validateRequest(createPostSchema),
  handleCreatePost
);

router.get("/:postId", handleGetPostById);

router.put(
  "/:postId",
  authenticateToken,
  validateRequest(updatePostSchema),
  handleUpdatePost
);

router.delete("/:postId", authenticateToken, handleDeletePost);

export default router;
