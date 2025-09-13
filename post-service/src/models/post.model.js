import { query } from "../utils/database.js";
import redis from "../utils/redis.js";
import logger from "../utils/logger.js";

const CACHE_EXPIRATION_SECONDS = 3600;

export const createPost = async (
  userId,
  { content, media_url, comments_enabled = true, scheduled_at = null }
) => {
  const isPublished = !scheduled_at || new Date(scheduled_at) <= new Date();

  const result = await query(
    `   INSERT INTO posts (user_id, content, media_url, comments_enabled, scheduled_at, is_published)
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING * `,
    [userId, content, media_url, comments_enabled, scheduled_at, isPublished]
  );

  return result.rows[0];
};

export const getPostById = async (postId) => {
  const cacheKey = `post:${postId}`;

  try {
    const cachedPost = await redis.get(cacheKey);
    if (cachedPost) {
      logger.verbose(`Cache hit for post ID: ${postId}`);
      return JSON.parse(cachedPost);
    }
  } catch (error) {
    logger.critical("Redis GET error in getPostById:", error);
  }

  const result = await query(
    `   SELECT * FROM posts
        WHERE id = $1
        AND is_deleted = FALSE AND is_published = TRUE  `,
    [postId]
  );

  const post = result.rows[0] || null;

  if (post) {
    try {
      await redis.set(
        cacheKey,
        JSON.stringify(post),
        "EX",
        CACHE_EXPIRATION_SECONDS
      );
    } catch (error) {
      logger.critical("Redis SET error in getPostById:", error);
    }
  }
};

export const getPostsByUserId = async (userId, limit = 20, offset = 0) => {
  const result = await query(
    `   SELECT * FROM posts 
        WHERE user_id = $1 
        AND is_deleted = FALSE AND is_published = TRUE
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3  `,
    [userId, limit, offset]
  );
  return result.rows;
};

export const updatePost = async (postId, userId, { content, media_url }) => {
  const result = await query(
    `   UPDATE posts
        SET
            content = COALESCE($1, content),
            media_url = COALESCE($2, media_url)
        WHERE id = $3 
        AND user_id = $4 AND is_deleted = FALSE
        RETURNING * `,
    [content, media_url, postId, userId]
  );

  const updatedPost = result.rows[0] || null;

  if (updatedPost) {
    const cacheKey = `post:${postId}`;

    try {
      await redis.del(cacheKey);
    } catch (error) {
      logger.error("Redis DEL error in updatePost:", error);
    }
  }

  return updatedPost;
};

export const deletePost = async (postId, userId) => {
  const result = await query(
    `   UPDATE posts
        SET 
            is_deleted = TRUE
        WHERE id = $1 
        AND user_id = $2    `,
    [postId, userId]
  );

  const wasDeleted = result.rowCount > 0;

  if (wasDeleted) {
    const cacheKey = `post:${postId}`;

    try {
      await redis.del(cacheKey);
    } catch (error) {
      logger.error("Redis DEL error in deletePost:", error);
    }
  }

  return wasDeleted;
};

export const searchPosts = async (searchTerm, limit = 20, offset = 0) => {
  const result = await query(
    `   SELECT * FROM posts
        WHERE content ILIKE $1 
        AND is_deleted = FALSE AND is_published = TRUE
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3  `,
    [`%${searchTerm}%`, limit, offset]
  );
  return result.rows;
};
