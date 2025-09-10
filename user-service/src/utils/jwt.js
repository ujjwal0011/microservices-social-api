import jwt from "jsonwebtoken";
import logger from "./logger.js";

export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    logger.critical("Token Verification Failed:", error);
    throw new Error("Invalid Token");
  }
};
