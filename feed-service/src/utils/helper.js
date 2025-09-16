import axios from "axios";
import logger from "./logger.js";

const POST_SERVICE_URL = process.env.POST_SERVICE_URL;
const INTERACTION_SERVICE_URL = process.env.INTERACTION_SERVICE_URL;

export const _enrichFeedWithPostDetails = async (postIds) => {
  if (!postIds || postIds.length === 0) {
    return [];
  }

  try {
    const enrichmentPromises = postIds.map(async (postId) => {
      try {
        const [postRes, likeCountRes, commentCountRes] = await Promise.all([
          axios.get(`${POST_SERVICE_URL}/api/posts/${postId}`),
          axios.get(
            `${INTERACTION_SERVICE_URL}/api/likes/post/${postId}/count`
          ),
          axios.get(
            `${INTERACTION_SERVICE_URL}/api/comments/post/${postId}/count`
          ),
        ]);

        const post = postRes.data.post;
        post.likes_count = likeCountRes.data.count;
        post.comments_count = commentCountRes.data.count;

        return post;
      } catch (error) {
        logger.critical(
          `Failed to enrich post ${postId}: ${error.message}. It may have been deleted.`
        );
        return null;
      }
    });

    const enrichedPosts = await Promise.all(enrichmentPromises);

    return enrichedPosts.filter((post) => post !== null);
  } catch (error) {
    logger.critical(`An error occurred during feed enrichment:`, error.message);
    return [];
  }
};
