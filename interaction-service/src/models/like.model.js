import { query } from "../utils/database.js";
import redis from "../utils/redis.js";
import logger from "../utils/logger.js";

const LIKES_LIST_CACHE_SECONDS = 60 * 5;
const LIKES_COUNT_CACHE_SECONDS = 60 * 10;

export const addLike = async (userId, postId) => {
  const result = await query(
    `   INSERT INTO likes (user_id, post_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, post_id) DO NOTHING
        RETURNING * `,
    [userId, postId]
  );

  return result.rows[0];
};

export const removeLike = async (userId, postId) => {
  const result = await query(
    `   DELETE FROM likes
        WHERE user_id = $1 AND post_id = $2 `,
    [userId, postId]
  );

  return result.rowCount > 0;
};

export const getLikerIdsByPostId = async (postId) => {
  const cacheKey = `post:${postId}:likers`;

  try {
    const cachedLikers = await redis.get(cacheKey);
    if (cachedLikers) {
      logger.verbose("Cache hit for liker IDs of post:", postId);
      return JSON.parse(cachedLikers);
    }
  } catch (error) {
    logger.critical("Redis GET error in getLikerIdsByPostId:", error);
  }

  const result = await query(
    `   SELECT user_id FROM likes
        WHERE post_id = $1  `,
    [postId]
  );

  const userIds = result.rows.map((row) => row.user_id);

  try {
    await redis.set(
      cacheKey,
      JSON.stringify(userIds),
      "EX",
      LIKES_LIST_CACHE_SECONDS
    );
  } catch (error) {
    logger.critical("Redis SET error in getLikerIdsByPostId:", error);
  }
};

export const getLikeCountByPostId = async (postId) => {
  const cacheKey = `post:${postId}:likes_count`;

  try {
    const cachedCount = await redis.get(cacheKey);
    if (cachedCount) {
      logger.verbose("Cache hit for like count of post:", postId);
      return parseInt(cachedCount, 10);
    }
  } catch (error) {
    logger.critical("Redis GET error in getLikeCountByPostId:", error);
  }

  const result = await query(
    `   SELECT COUNT(*) FROM likes
        WHERE post_id = $1  `,
    [postId]
  );

  const count = parseInt(result.rows[0].count, 10);

  try {
    await redis.set(cacheKey, count, "EX", LIKES_COUNT_CACHE_SECONDS);
  } catch (error) {
    logger.critical("Redis SET error in getLikeCountByPostId:", error);
  }

  return count;
};
