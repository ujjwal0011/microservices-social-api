import { verifyToken } from "../utils/jwt.js";
import { getUserById } from "../models/user.model.js";
import logger from "../utils/logger.js";

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader && !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access token required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    const user = await getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = {
      userId: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
    };

    next();
  } catch (error) {
    logger.critical("Authentication error:", error.message);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};
