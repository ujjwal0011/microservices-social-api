import { createUser, verifyPassword } from "../models/auth.model.js";
import {
  getUserByUsernameForAuth,
  getUserByEmail,
} from "../models/user.model.js";
import { generateToken } from "../utils/jwt.js";
import { catchAsyncErrors } from "../middleware/catchAsyncError.js";
import {
  UnauthorizedError,
  ConflictError,
  BadRequestError,
} from "../middleware/error.js";
import logger from "../utils/logger.js";

export const register = catchAsyncErrors(async (req, res) => {
  const { username, email, password, full_name } = req.validatedData;

  const existingUser = await getUserByUsernameForAuth(username);
  if (existingUser) {
    return next(new ConflictError("Username already taken"));
  }

  const existingEmail = await getUserByEmail(email);
  if (existingEmail) {
    return next(new ConflictError("Email already registered"));
  }

  const user = await createUser({ username, email, password, full_name });

  const tokenPayload = { userId: user.id, username: user.username };
  const token = generateToken(tokenPayload);

  logger.verbose(`New user registered: ${username}`);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      created_at: user.created_at,
    },
    token,
  });
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const { username, password } = req.validatedData;

  if (!username || !password) {
    return next(new BadRequestError("Username and password are required"));
  }

  const user = await getUserByUsernameForAuth(username);
  if (!user) {
    return next(new UnauthorizedError("Invalid username or password"));
  }

  const isPasswordValid = await verifyPassword(password, user.password_hash);
  if (!isPasswordValid) {
    return next(new UnauthorizedError("Invalid username or password"));
  }

  const tokenPayload = { userId: user.id, username: user.username };
  const token = generateToken(tokenPayload);

  logger.verbose(`User logged in: ${username}`);

  res.status(200).json({
    success: true,
    message: "Login successful",
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
    },
    token,
  });
});

export const getMyProfile = catchAsyncErrors(async (req, res, next) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});
