import { verifyToken } from "../utils/jwt.js";
import { UnauthorizedError } from "./error.js";
import { catchAsyncErrors } from "./catchAsyncError.js";
import logger from "../utils/logger.js";

export const authenticateToken = catchAsyncErrors(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Access token required");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
    };

    next();
  } catch (error) {
    logger.critical("Authentication error:", error.message);
    throw new UnauthorizedError("Invalid or expired token");
  }
});
