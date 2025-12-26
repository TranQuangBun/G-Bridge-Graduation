/**
 * Custom error classes and error logging utilities
 */

import { logger } from "./Logger.js";

export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, errors = null) {
    super(message, 400);
    this.errors = errors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication failed") {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Access denied") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, 409);
  }
}

/**
 * Log error with context (only logs errors >= 500 or errors without statusCode)
 */
export function logError(error, context = "") {
  const statusCode = error.statusCode || error.status || 500;
  const shouldLog = statusCode >= 500 || (!error.statusCode && !error.status);

  if (shouldLog) {
    logger.error(context || "Error occurred", error);
  }
}

/**
 * Log critical error (always logs)
 */
export function logCriticalError(error, context = "") {
  logger.error(context || "Critical error occurred", error);
}

