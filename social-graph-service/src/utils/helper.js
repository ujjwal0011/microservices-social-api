import axios from "axios";
import { NotFoundError } from "../middleware/error.js";
import logger from "./logger.js";

const USER_SERVICE_URL = process.env.USER_SERVICE_URL;

export const _validateUserExists = async (userId) => {
  try {
    await axios.get(`${USER_SERVICE_URL}/api/users/${userId}/profile`);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new NotFoundError(`User with ID ${userId} not found.`);
    }

    logger.critical(
      `Error validating user existence for userId ${userId}:`,
      error.message
    );

    throw new Error(
      "Could not verify user existence due to an internal error."
    );
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
