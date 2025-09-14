import {
  createComment,
  updateComment,
  deleteComment,
  getCommentsByPostId,
  getCommentById,
  getCommentCountByPostId,
} from "../models/comment.model.js";
import { catchAsyncErrors } from "../middleware/catchAsyncError.js";
import { NotFoundError, ForbiddenError } from "../middleware/error.js";
import { _validatePostExists, _fetchUserDetails } from "../utils/helper.js";
import redis from "../utils/redis.js";
import logger from "../utils/logger.js";

const _updateCommentCountCache = async (postId, operation) => {
  const countkey = `post:${postId}:comments_count`;

  try {
    const keyExists = await redis.exists(countkey);
    if (keyExists) {
      if (operation === "INCR") {
        await redis.incr(countkey);
      } else if (operation === "DECR") {
        await redis.decr(countkey);
      }
    }
  } catch (error) {
    logger.critical(
      `Failed to ${operation} comment count for post ${postId}:`,
      error
    );
  }
};

export const handleCreateComment = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.userId;
  const { postId } = req.params;
  const { content } = req.validatedData;
  const numericPostId = parseInt(postId, 10);

  const post = await _validatePostExists(numericPostId);

  if (!post.comments_enabled) {
    return next(new ForbiddenError("Comments are disabled for this post."));
  }

  const comment = await createComment(userId, numericPostId, content);

  await _updateCommentCountCache(numericPostId, "INCR");

  logger.verbose(
    `User ${userId} created comment ${comment.id} on post ${numericPostId}`
  );

  res.status(201).json({
    success: true,
    comment,
  });
});

export const handleUpdateComment = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.userId;
  const { commentId } = req.params;
  const { content } = req.validatedData;

  const updatedComment = await updateComment(
    parseInt(commentId),
    userId,
    content
  );
  if (!updateComment) {
    return next(new NotFoundError("Comment not found or not owned by user."));
  }

  logger.verbose(`User ${userId} updated comment ${commentId}`);

  res.status(200).json({
    success: true,
    comment: updatedComment,
  });
});

export const handleDeleteComment = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.userId;
  const { commentId } = req.params;
  const numericCommentId = parseInt(commentId, 10);

  const commentToDelete = await getCommentById(numericCommentId);
  if (!commentToDelete) {
    return next(new NotFoundError("Comment not found."));
  }

  if (commentToDelete.user_id !== userId) {
    return next(
      new ForbiddenError("You are not authorized to delete this comment.")
    );
  }

  const deleted = await deleteComment(numericCommentId, userId);
  if (!deleted) {
    return next(new NotFoundError("Comment not found or already deleted."));
  }

  await _updateCommentCountCache(commentToDelete.post_id, "DECR");

  logger.verbose(`User ${userId} deleted comment ${commentId}`);

  res.status(200).send();
});

export const handleGetPostComments = catchAsyncErrors(
  async (req, res, next) => {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const numericPostId = parseInt(postId, 10);

    await _validatePostExists(numericPostId);

    const comments = await getCommentsByPostId(numericPostId, limit, offset);
    if (!comments || comments.length === 0) {
      return res.status(200).json({
        success: true,
        comments: [],
        pagination: {
          page,
          limit,
          hasMore: false,
        },
      });
    }

    const userIds = [...new Set(comments.map((c) => c.user_id))];
    const userProfiles = await _fetchUserDetails(userIds);
    const usersMap = new Map(userProfiles.map((u) => [u.id, u]));

    const enrichedComments = comments.map((comment) => ({
      ...comment,
      author: usersMap.get(comment.user_id) || {
        id: comment.user_id,
        name: "Unknown User",
      },
    }));

    res.status(200).json({
      success: true,
      comments: enrichedComments,
      pagination: {
        page,
        limit,
        hasMore: comments.length === limit,
      },
    });
  }
);

export const handleGetCommentCount = catchAsyncErrors(
  async (req, res, next) => {
    const { postId } = req.params;
    const numericPostId = parseInt(postId, 10);

    await _validatePostExists(numericPostId);

    const count = await getCommentCountByPostId(numericPostId);
    res.status(200).json({ success: true, count });
  }
);
