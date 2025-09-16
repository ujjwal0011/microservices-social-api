import axios from "axios";
import redis from "../utils/redis.js";
import logger from "../utils/logger.js";

const STREAM_NAME = "post_events";
const GROUP_NAME = "feed_generators";
const CONSUMER_NAME = `consumer-${process.pid}`;

const SOCIAL_GRAPH_SERVICE_URL = process.env.SOCIAL_GRAPH_SERVICE_URL;

const processPostEvent = async (message) => {
  const { postId, userId, createdAt } = message;

  logger.verbose(
    `Processing post event for postId: ${postId}, userId: ${userId}`
  );

  try {
    const response = await axios.get(
      `${SOCIAL_GRAPH_SERVICE_URL}/api/social/users/${userId}/followers`
    );
    const followers = response.data.followers;
    const followerIds = followers.map((f) => f.id);

    const authorFeedKey = `user:${userId}:feed`;
    await redis.zadd(authorFeedKey, parseInt(createdAt, 10), postId);

    if (followerIds.length > 0) {
      const pipeline = redis.pipeline();

      for (const followerId of followerIds) {
        const followerFeedKey = `user:${followerId}:feed`;

        pipeline.zadd(followerFeedKey, parseInt(createdAt, 10), postId);
      }

      await pipeline.exec();

      logger.verbose(
        `Fanned out post: ${postId} to ${followerIds.length} followers.`
      );
    }
  } catch (error) {
    logger.critical(
      `Failed to process event for post ${postId}:`,
      error.message
    );
  }
};

export const startFeedWorker = async () => {
  logger.verbose("Starting feed worker...");

  try {
    await redis.xgroup("CREATE", STREAM_NAME, GROUP_NAME, "$", "MKSTREAM");
    logger.verbose(`Consumer group '${GROUP_NAME}' created or already exists.`);
  } catch (error) {
    if (!error.message.includes("BUSYGROUP")) {
      logger.critical("Error creating consumer group:", error);
      return;
    }
  }

  while (true) {
    try {
      const response = await redis.xreadgroup(
        "GROUP",
        GROUP_NAME,
        CONSUMER_NAME,
        "BLOCK",
        5000,
        "STREAMS",
        STREAM_NAME,
        ">"
      );

      if (response) {
        const [stream, entries] = response[0];
        for (const [id, fields] of entries) {
          const parsedMessage = {};
          for (let i = 0; i < fields.length; i += 2) {
            parsedMessage[fields[i]] = fields[i + 1];
          }

          await processPostEvent(parsedMessage);
          await redis.xack(STREAM_NAME, GROUP_NAME, id);
        }
      }
    } catch (error) {
      logger.critical("Feed worker loop error:", error);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};
