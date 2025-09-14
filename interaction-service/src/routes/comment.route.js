import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  validateRequest,
  createCommentSchema,
  updateCommentSchema,
} from "../utils/validation.js";
import {
  handleCreateComment,
  handleUpdateComment,
  handleDeleteComment,
  handleGetPostComments,
  handleGetCommentCount,
} from "../controllers/comment.controller.js";

const router = express.Router();

router.get("/post/:postId/count", handleGetCommentCount);

router.get("/post/:postId", handleGetPostComments);

router.post(
  "/post/:postId",
  authenticateToken,
  validateRequest(createCommentSchema),
  handleCreateComment
);

router.put(
  "/:commentId",
  authenticateToken,
  validateRequest(updateCommentSchema),
  handleUpdateComment
);

router.delete("/:commentId", authenticateToken, handleDeleteComment);

export default router;
