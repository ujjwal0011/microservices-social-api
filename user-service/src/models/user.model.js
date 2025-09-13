import { query } from "../utils/database.js";
import redis from "../utils/redis.js";
import { ConflictError } from "../middleware/error.js";
import logger from "../utils/logger.js";

const CACHE_EXPIRATION_SECONDS = 3600;

export const getUserById = async (id) => {
  const cacheKey = `user:${id}`;

  try {
    const cachedUser = await redis.get(cacheKey);
    if (cachedUser) {
      logger.verbose(`Cache hit for user ID: ${id}`);
      return JSON.parse(cachedUser);
    }
  } catch (error) {
    logger.critical("Redis GET error in getUserById:", error);
  }

  const result = await query(
    `   SELECT id, username, email, full_name, created_at
        FROM users
        WHERE id = $1
        AND is_deleted = FALSE  `,
    [id]
  );

  const user = result.rows[0] || null;

  if (user) {
    try {
      await redis.set(
        cacheKey,
        JSON.stringify(user),
        "EX",
        CACHE_EXPIRATION_SECONDS
      );
    } catch (error) {
      logger.critical("Redis SET error in getUserById:", error);
    }
  }

  return user;
};

export const getUserByUsernameForAuth = async (username) => {
  const result = await query(
    `   SELECT id, username, email, password_hash
        FROM users
        WHERE username = $1
        AND is_deleted = FALSE  `,
    [username]
  );

  return result.rows[0] || null;
};

export const getUserByEmail = async (email) => {
  const result = await query(
    `   SELECT id, username, email
        FROM users
        WHERE email = $1
        AND is_deleted = FALSE  `,
    [email]
  );

  return result.rows[0] || null;
};

export const findUsersByName = async (name, limit = 20, offset = 0) => {
  const result = await query(
    `   SELECT id, username, full_name
        FROM users
        WHERE (username ILIKE $1 OR full_name ILIKE $1)
        AND is_deleted = FALSE
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3  `,
    [`%${name}%`, limit, offset]
  );

  return result.rows;
};

export const getUserProfile = async (userId) => {
  return getUserById(userId);
};

export const updateUserProfile = async (
  userId,
  { username, full_name, email }
) => {
  if (username) {
    const existingUser = await getUserByUsernameForAuth(username);
    if (existingUser && existingUser.id !== userId) {
      throw new ConflictError("Username is already taken.");
    }
  }

  const result = await query(
    `   UPDATE users
        SET 
            username = COALESCE($1, username), 
            full_name = COALESCE($2, full_name), 
            email = COALESCE($3, email)
        WHERE id = $4
        AND is_deleted = FALSE
        RETURNING id, username, full_name, email, created_at, updated_at    `,
    [username, full_name, email, userId]
  );

  const updatedUser = result.rows[0] || null;

  if (updatedUser) {
    const cacheKey = `user:${userId}`;
    try {
      await redis.del(cacheKey);
    } catch (error) {
      console.error("Redis DEL error in updateUserProfile:", error);
    }
  }

  return updatedUser;
};
