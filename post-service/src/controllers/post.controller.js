import axios from "axios";
import {
  createPost,
  getPostById,
  getPostsByUserId,
  updatePost,
  deletePost,
  searchPosts,
} from "../models/post.model.js";
import { catchAsyncErrors } from "../middleware/catchAsyncError.js";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "../middleware/error.js";
import redis from "../utils/redis.js";
import logger from "../utils/logger.js";

const USER_SERVICE_URL = process.env.USER_SERVICE_URL;
const STREAM_NAME = "post_events";

const fetchUserDetails = async (userId) => {
  try {
    const response = await axios.get(
      `${USER_SERVICE_URL}/api/users/${userId}/profile`
    );
    return response.data.profile;
  } catch (error) {
    logger.critical(
      `Could not fetch user details for userId ${userId}:`,
      error.message
    );
    return {
      id: userId,
      username: "unknown user",
      full_name: "unknown user",
    };
  }
};

export const handleCreatePost = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.userId;
  const { content, media_url, comments_enabled, scheduled_at } =
    req.validatedData;

  const newPost = await createPost(userId, {
    content,
    media_url,
    comments_enabled,
    scheduled_at,
  });

  if (newPost.is_published) {
    try {
      const message = {
        postId: newPost.id.toString(),
        userId: newPost.user_id.toString(),
        createdAt: newPost.created_at.getTime().toString(),
      };

      await redis.xadd(STREAM_NAME, "*", ...Object.entries(message).flat());

      logger.verbose(
        `Event published to redis stream: ${STREAM_NAME} for Post ID: ${newPost.id}`
      );
    } catch (error) {
      logger.critical(
        `Failed to publish event to redis stream for Post ID: ${newPost.id}:`,
        error.message
      );
    }
  }

  logger.verbose(`Post created with ID: ${newPost.id} by User ID: ${userId}`);

  res.status(201).json({
    success: true,
    message: newPost.is_published
      ? "Post created successfully"
      : "Post scheduled successfully",
    post: newPost,
  });
});

export const handleGetPostById = catchAsyncErrors(async (req, res, next) => {
  const { postId } = req.params;

  const post = await getPostById(parseInt(postId));
  if (!post) {
    return next(new NotFoundError("Post not found."));
  }

  const authorDetails = await fetchUserDetails(post.user_id);
  const postWithAuthor = { ...post, author: authorDetails };

  res.status(200).json({
    success: true,
    post: postWithAuthor,
  });
});

export const handleGetUserPosts = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const posts = await getPostsByUserId(parseInt(userId), limit, offset);

  res.status(200).json({
    success: true,
    posts,
    pagination: {
      page,
      limit,
      hasMore: posts.length === limit,
    },
  });
});

export const handleUpdatePost = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.userId;
  const { postId } = req.params;
  const { content, media_url } = req.validatedData;

  const existingPost = await getPostById(parseInt(postId));
  if (!existingPost) {
    return next(new NotFoundError("Post not found."));
  }

  if (existingPost.user_id !== userId) {
    return next(
      new UnauthorizedError("You are not authorized to update this post.")
    );
  }

  const updatedPost = await updatePost(parseInt(postId), userId, {
    content,
    media_url,
  });

  logger.verbose(`Post with ID: ${postId} updated by User ID: ${userId}`);

  res
    .status(200)
    .json({ success: true, message: "Post updated.", post: updatedPost });
});

export const handleDeletePost = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.userId;
  const { postId } = req.params;

  const existingPost = await getPostById(parseInt(postId));
  if (!existingPost) {
    return next(new NotFoundError("Post not found."));
  }

  if (existingPost.user_id !== userId) {
    return next(
      new UnauthorizedError("You are not authorized to delete this post.")
    );
  }

  await deletePost(parseInt(postId), userId);

  logger.verbose(`User ${userId} deleted post ${postId}`);

  res.status(204).send();
});

export const handleSearchPosts = catchAsyncErrors(async (req, res, next) => {
  const { term } = req.query;
  if (!term || term.trim() === "") {
    return next(new BadRequestError("Search term 'term' cannot be empty"));
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const posts = await searchPosts(term, limit, offset);

  res.status(200).json({
    success: true,
    posts,
    pagination: {
      page,
      limit,
      hasMore: posts.length === limit,
    },
  });
});
