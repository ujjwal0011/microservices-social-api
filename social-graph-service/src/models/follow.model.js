import { query } from "../utils/database.js";
import redis from "../utils/redis.js";
import logger from "../utils/logger.js";

const COUNT_CACHE_SECONDS = 60 * 15;

export const addFollow = async (followerId, followingId) => {
  const result = await query(
    `   INSERT INTO follows (follower_id, following_id)
        VALUES ($1, $2)
        ON CONFLICT (follower_id, following_id) DO NOTHING
        RETURNING * `,
    [followerId, followingId]
  );

  return result.rows[0];
};

export const removeFollow = async (followerId, followingId) => {
  const result = await query(
    `   DELETE FROM follows
        WHERE follower_id = $1
        AND following_id = $2  `,
    [followerId, followingId]
  );

  return result.rowCount > 0;
};

export const getFollowingIds = async (userId) => {
  const result = await query(
    `   SELECT following_id FROM follows
        WHERE follower_id = $1  `,
    [userId]
  );

  return result.rows.map((row) => row.following_id);
};

export const getFollowerIds = async (userId) => {
  const result = await query(
    `   SELECT follower_id FROM follows 
        WHERE following_id = $1 `,
    [userId]
  );

  return result.rows.map((row) => row.follower_id);
};

export const getFollowingCount = async (userId) => {
  const cacheKey = `user:${userId}:following_count`;

  try {
    const cachedCount = await redis.get(cacheKey);
    if (cachedCount) {
      logger.verbose(`Cache hit for following count of user ${userId}`);
      return parseInt(cachedCount, 10);
    }
  } catch (error) {
    logger.critical(
      `Redis GET error for following count of user ${userId}:`,
      error
    );
  }

  const result = await query(
    `   SELECT COUNT(*) FROM follows
        WHERE follower_id = $1  `,
    [userId]
  );

  const count = parseInt(result.rows[0].count, 10);

  try {
    await redis.set(cacheKey, count, "EX", COUNT_CACHE_SECONDS);
  } catch (error) {
    logger.critical(
      `Redis SET error for following count of user ${userId}:`,
      error
    );
  }

  return count;
};

export const getFollowerCount = async (userId) => {
  const cacheKey = `user:${userId}:followers_count`;

  try {
    const cachedCount = await redis.get(cacheKey);
    if (cachedCount) {
      logger.verbose(`Cache hit for followers count of user ${userId}`);
      return parseInt(cachedCount, 10);
    }
  } catch (error) {
    logger.critical(
      `Redis GET error for followers count of user ${userId}:`,
      error
    );
  }

  const result = await query(
    `   SELECT COUNT(*) FROM follows
        WHERE following_id = $1 `,
    [userId]
  );

  const count = parseInt(result.rows[0].count, 10);

  try {
    await redis.set(cacheKey, count, "EX", COUNT_CACHE_SECONDS);
  } catch (error) {
    logger.critical(
      `Redis SET error for followers count of user ${userId}:`,
      error
    );
  }

  return count;
};
