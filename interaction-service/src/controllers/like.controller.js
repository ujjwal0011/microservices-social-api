import {
  addLike,
  removeLike,
  getLikerIdsByPostId,
  getLikeCountByPostId,
} from "../models/like.model.js";
import { catchAsyncErrors } from "../middleware/catchAsyncError.js";
import { NotFoundError, ConflictError } from "../middleware/error.js";
import { _validatePostExists, _fetchUserDetails } from "../utils/helper.js";
import redis from "../utils/redis.js";
import logger from "../utils/logger.js";

const _updateLikeCountCache = async (postId, operation) => {
  const countKey = `post:${postId}:likes_count`;

  try {
    const keyExists = await redis.exists(countKey);
    if (keyExists) {
      if (operation === "INCR") {
        await redis.incr(countKey);
      } else if (operation === "DECR") {
        await redis.decr(countKey);
      }
    }
  } catch (error) {
    logger.critical(
      `Failed to ${operation} like count for post ${postId}:`,
      error
    );
  }
};

const _invalidateLikerListCache = async (postId) => {
  const listKey = `post:${postId}:likers`;

  try {
    await redis.del(listKey);
  } catch (error) {
    logger.critical(
      `Failed to invalidate liker list cache for post ${postId}:`,
      error
    );
  }
};

export const handleLikePost = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.userId;
  const { postId } = req.params;
  const numericPostId = parseInt(postId, 10);

  await _validatePostExists(numericPostId);

  const like = await addLike(userId, numericPostId);
  if (!like) {
    return next(new ConflictError("Post already liked."));
  }

  await _updateLikeCountCache(numericPostId, "INCR");
  await _invalidateLikerListCache(numericPostId);

  logger.verbose(`User ${userId} liked post ${numericPostId}`);

  res.status(201).json({
    success: true,
    message: "Post liked successfully.",
  });
});

export const handleUnlikePost = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.userId;
  const { postId } = req.params;
  const numericPostId = parseInt(postId, 10);

  await _validatePostExists(numericPostId);

  const unlike = await removeLike(userId, numericPostId);
  if (!unlike) {
    return next(new NotFoundError("Like not found or post already liked."));
  }

  await _updateLikeCountCache(numericPostId, "DECR");
  await _invalidateLikerListCache(numericPostId);

  logger.verbose(`User ${userId} unliked post ${numericPostId}`);

  res.status(200).json({
    success: true,
    message: "Post unliked successfully.",
  });
});

export const handleGetPostLikes = catchAsyncErrors(async (req, res, next) => {
  const { postId } = req.params;
  const numericPostId = parseInt(postId, 10);

  await _validatePostExists(numericPostId);

  const userIds = await getLikerIdsByPostId(numericPostId);
  if (!userIds || userIds.length === 0) {
    return res.status(200).json({
      success: true,
      users: [],
    });
  }

  const userProfiles = await _fetchUserDetails(userIds);

  res.status(200).json({
    success: true,
    users: userProfiles,
  });
});

export const handleGetLikeCount = catchAsyncErrors(async (req, res, next) => {
  const { postId } = req.params;
  const numericPostId = parseInt(postId, 10);

  await _validatePostExists(numericPostId);

  const count = await getLikeCountByPostId(numericPostId);

  res.status(200).json({
    success: true,
    count,
  });
});
