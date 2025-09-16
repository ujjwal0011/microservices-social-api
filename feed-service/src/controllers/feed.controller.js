import { catchAsyncErrors } from "../middleware/catchAsyncError.js";
import { _enrichFeedWithPostDetails } from "../utils/helper.js";
import redis from "../utils/redis.js";
import logger from "../utils/logger.js";

export const handleGetFeed = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.userId;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = (page - 1) * limit;

  const feedKey = `user:${userId}:feed`;
  logger.verbose(`Fetching feed for user ${userId}`);

  try {
    const postIds = await redis.zrevrange(feedKey, offset, offset + limit - 1);
    if (!postIds || postIds.length === 0) {
      return res.status(200).json({
        success: true,
        feed: [],
        pagination: {
          page,
          limit,
          hasMore: false,
        },
      });
    }

    const enrichedFeed = await _enrichFeedWithPostDetails(postIds);

    res.status(200).json({
      success: true,
      feed: enrichedFeed,
      pagination: {
        page,
        limit,
        hasMore: enrichedFeed.length === limit,
      },
    });
  } catch (error) {
    logger.critical(`Error fetching feed for user ${userId}:`, error);
    next(error);
  }
});
