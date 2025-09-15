import {
  addFollow,
  removeFollow,
  getFollowingIds,
  getFollowerIds,
  getFollowingCount,
  getFollowerCount,
} from "../models/follow.model.js";
import { catchAsyncErrors } from "../middleware/catchAsyncError.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from "../middleware/error.js";
import { _validateUserExists, _fetchUserDetails } from "../utils/helper.js";
import redis from "../utils/redis.js";
import logger from "../utils/logger.js";

const _updateFollowCounts = async (followerId, followingId, operation) => {
  const followerKey = `user:${followerId}:following_count`;
  const followingKey = `user:${followingId}:followers_count`;
  const command = operation === "INCR" ? "incr" : "decr";

  try {
    const followerKeyExists = await redis.exists(followerKey);
    if (followerKeyExists) {
      await redis[command](followerKey);
    }

    const followingKeyExists = await redis.exists(followingKey);
    if (followingKeyExists) {
      await redis[command](followingKey);
    }
  } catch (error) {
    logger.critical(
      `Failed to update follow counts for users ${followerId}, ${followingId}:`,
      error
    );
  }
};

export const handleFollow = catchAsyncErrors(async (req, res, next) => {
  const followerId = req.user.userId;
  const { userId: followingId } = req.params;
  const numericFollowingId = parseInt(followingId, 10);

  if (followerId === numericFollowingId) {
    return next(new BadRequestError("You cannot follow yourself."));
  }

  await _validateUserExists(numericFollowingId);

  const follow = await addFollow(followerId, numericFollowingId);
  if (!follow) {
    return next(new ConflictError("You are already following this user."));
  }

  await _updateFollowCounts(followerId, numericFollowingId, "INCR");

  logger.verbose(`User ${followerId} followed user ${numericFollowingId}`);

  res.status(200).json({
    success: true,
    message: `Successfully followed user: ${numericFollowingId}.`,
  });
});

export const handleUnfollow = catchAsyncErrors(async (req, res, next) => {
  const followerId = req.user.userId;
  const { userId: followingId } = req.params;
  const numericFollowingId = parseInt(followingId, 10);

  const unfollowed = await removeFollow(followerId, numericFollowingId);
  if (!unfollowed) {
    return next(new NotFoundError("You are not following this user."));
  }

  await _updateFollowCounts(followerId, numericFollowingId, "DECR");

  logger.verbose(`User ${followerId} unfollowed user ${numericFollowingId}`);

  res.status(200).json({
    success: true,
    message: `Successfully unfollowed user: ${numericFollowingId}.`,
  });
});

export const handleGetFollowing = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;
  const numericUserId = parseInt(userId, 10);

  await _validateUserExists(numericUserId);

  const followingIds = await getFollowingIds(numericUserId);
  if (followingIds.length === 0) {
    return res.status(200).json({
      success: true,
      following: [],
    });
  }

  const userProfiles = await _fetchUserDetails(followingIds);

  res.status(200).json({
    success: true,
    following: userProfiles,
  });
});

export const handleGetFollowers = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;
  const numericUserId = parseInt(userId, 10);

  await _validateUserExists(numericUserId);

  const followerIds = await getFollowerIds(numericUserId);
  if (followerIds.length === 0) {
    return res.status(200).json({
      success: true,
      followers: [],
    });
  }

  const userProfiles = await _fetchUserDetails(followerIds);

  res.status(200).json({
    success: true,
    followers: userProfiles,
  });
});

export const handleGetFollowingCount = catchAsyncErrors(
  async (req, res, next) => {
    const { userId } = req.params;
    const numericUserId = parseInt(userId, 10);

    const followingCount = await getFollowingCount(numericUserId);

    res.status(200).json({
      success: true,
      followingCount: followingCount,
    });
  }
);

export const handleGetFollowerCount = catchAsyncErrors(
  async (req, res, next) => {
    const { userId } = req.params;
    const numericUserId = parseInt(userId, 10);

    const followerCount = await getFollowerCount(numericUserId);

    res.status(200).json({
      success: true,
      followerCount: followerCount,
    });
  }
);
