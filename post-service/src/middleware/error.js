import logger from "../utils/logger.js";

class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Custom error classes for clarity
class BadRequestError extends ErrorHandler {
  constructor(message = "Bad Request") {
    super(message, 400);
  }
}

class UnauthorizedError extends ErrorHandler {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

class ForbiddenError extends ErrorHandler {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

class NotFoundError extends ErrorHandler {
  constructor(message = "Not Found") {
    super(message, 404);
  }
}

class ConflictError extends ErrorHandler {
  constructor(message = "Conflict") {
    super(message, 409);
  }
}

class InternalServerError extends ErrorHandler {
  constructor(message = "Internal Server Error") {
    super(message, 500);
  }
}

// Global error middleware
const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  logger.critical(`[${statusCode}] ${message} - Stack: ${err.stack}`);

  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

export {
  ErrorHandler,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
  errorMiddleware,
};
