import { query } from "../utils/database.js";
import redis from "../utils/redis.js";
import logger from "../utils/logger.js";

const COMMENT_COUNT_CACHE_SECONDS = 60 * 10;

export const createComment = async (userId, postId, content) => {
  const result = await query(
    `   INSERT INTO comments (user_id, post_id, content)
        VALUES ($1, $2, $3)
        RETURNING * `,
    [userId, postId, content]
  );

  return result.rows[0];
};

export const updateComment = async (commentId, userId, content) => {
  const result = await query(
    `   UPDATE comments
        SET 
            content = $1
        WHERE id = $2 
        AND user_id = $3 AND is_deleted = FALSE
        RETURNING * `,
    [content, commentId, userId]
  );

  return result.rows[0] || null;
};

export const deleteComment = async (commentId, userId) => {
  const result = await query(
    `   UPDATE comments 
        SET 
            is_deleted = TRUE
        WHERE id = $1 
        AND user_id = $2 AND is_deleted = FALSE `,
    [commentId, userId]
  );

  return result.rowCount > 0;
};

export const getCommentsByPostId = async (postId, limit = 20, offset = 0) => {
  const result = await query(
    `   SELECT id, user_id, post_id, content, created_at, updated_at
        FROM comments
        WHERE post_id = $1 
        AND is_deleted = FALSE
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3  `,
    [postId, limit, offset]
  );

  return result.rows;
};

export const getCommentById = async (commentId) => {
  const result = await query(
    `   SELECT * FROM comments
        WHERE id = $1 
        AND is_deleted = FALSE  `,
    [commentId]
  );

  return result.rows[0] || null;
};

export const getCommentCountByPostId = async (postId) => {
  const cacheKey = `post:${postId}:comments_count`;

  try {
    const cachedCount = await redis.get(cacheKey);
    if (cachedCount) {
      logger.verbose("Cache hit for comment count of post:", postId);
      return parseInt(cachedCount, 10);
    }
  } catch (error) {
    logger.critical("Redis GET error in getCommentCountByPostId:", error);
  }

  const result = await query(
    `   SELECT COUNT(*) FROM comments
        WHERE post_id = $1
        AND is_deleted = FALSE  `,
    [postId]
  );

  const count = parseInt(result.rows[0].count, 10);

  try {
    await redis.set(cacheKey, count, "EX", COMMENT_COUNT_CACHE_SECONDS);
  } catch (error) {
    logger.critical("Redis SET error in getCommentCountByPostId:", error);
  }

  return count;
};
