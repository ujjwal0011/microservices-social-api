import axios from "axios";
import { NotFoundError } from "../middleware/error.js";
import logger from "../utils/logger.js";

const POST_SERVICE_URL = process.env.POST_SERVICE_URL;
const USER_SERVICE_URL = process.env.USER_SERVICE_URL;

export const _validatePostExists = async (postId) => {
  try {
    const response = await axios.get(`${POST_SERVICE_URL}/api/posts/${postId}`);
    return response.data.post;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new NotFoundError("Post not found");
    }

    logger.critical(
      `Error validating post existence for postId ${postId}:`,
      error.message
    );
    throw new Error("Could not verify post existence.");
  }
};

export const _fetchUserDetails = async (userIds) => {
  if (!userIds || userIds.length === 0) {
    return [];
  }

  try {
    const userPromises = userIds.map((id) =>
      axios.get(`${USER_SERVICE_URL}/api/users/${id}/profile`)
    );

    const userResponses = await Promise.all(userPromises);

    return userResponses.map((res) => res.data.profile);
  } catch (error) {
    logger.critical(
      `Failed to fetch user details for IDs ${userIds}:`,
      error.message
    );

    return userIds.map((id) => ({
      id,
      username: "unknown",
      full_name: "Unknown User",
    }));
  }
};
