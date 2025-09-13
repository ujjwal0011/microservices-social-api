import axios from "axios";
import {
  getUserById,
  getUserProfile as fetchUserProfile,
  findUsersByName,
  updateUserProfile as modifyUserProfile,
} from "../models/user.model.js";
import { catchAsyncErrors } from "../middleware/catchAsyncError.js";
import { BadRequestError, NotFoundError } from "../middleware/error.js";
import logger from "../utils/logger.js";

const SOCIAL_GRAPH_SERVICE_URL = process.env.SOCIAL_GRAPH_SERVICE_URL;

export const getUserProfile = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;

  const profile = await fetchUserProfile(parseInt(userId));
  if (!profile) {
    return next(new NotFoundError("User not found"));
  }

  try {
    // const [followersRes, followingRes] = await Promise.all([
    //   axios.get(
    //     `${SOCIAL_GRAPH_SERVICE_URL}/api/users/${userId}/followers/count`
    //   ),
    //   axios.get(
    //     `${SOCIAL_GRAPH_SERVICE_URL}/api/users/${userId}/following/count`
    //   ),
    // ]);

    const fullProfile = {
      ...profile,
      // followers_count: followersRes.data.count,
      // following_count: followingRes.data.count,
    };

    res.status(200).json({ success: true, profile: fullProfile });
  } catch (error) {
    logger.critical("Could not fetch follow counts:", error.message);
    res.status(200).json({
      success: true,
      profile: { ...profile, followers_count: null, following_count: null },
      warning: "Follower data is currently unavailable.",
    });
  }
});

export const searchUsers = catchAsyncErrors(async (req, res, next) => {
  const { q: searchTerm } = req.query;
  if (!searchTerm || searchTerm.trim() === "") {
    return next(new BadRequestError("Search query 'q' is required."));
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const users = await findUsersByName(searchTerm, limit, offset);

  res.status(200).json({
    success: true,
    users,
    pagination: {
      page,
      limit,
      hasMore: users.length === limit,
    },
  });
});

export const updateUserProfile = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.userId;
  const updates = req.validatedData;

  const updatedUser = await modifyUserProfile(userId, updates);

  if (!updatedUser) {
    return next(new NotFoundError("User not found or nothing to update."));
  }

  res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    user: updatedUser,
  });
});
