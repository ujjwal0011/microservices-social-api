import cron from "node-cron";
import { query } from "./database.js";
import logger from "./logger.js";

const publishScheduledPosts = async () => {
  logger.verbose("Running scheduled posts job...");
  try {
    const result = await query(
      ` UPDATE posts SET is_published = TRUE 
        WHERE scheduled_at <= NOW() AND is_published = FALSE
        RETURNING id    `
    );

    if (result.rowCount > 0) {
      const postIds = result.rows.map((row) => row.id).join(", ");
      logger.verbose(
        `Published ${result.rowCount} scheduled post(s): ${postIds}`
      );
    }
  } catch (error) {
    logger.critical("Error in scheduled posts job:", error);
  }
};

export const startScheduler = () => {
  cron.schedule("* * * * *", publishScheduledPosts);
  logger.verbose("Cron job for scheduled posts has been started.");
};
