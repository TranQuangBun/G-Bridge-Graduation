import { ValidationError } from "../utils/Errors.js";

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const validatePassword = (password) => {
  if (!password || password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters");
  }

  if (!/[A-Z]/.test(password)) {
    throw new ValidationError("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    throw new ValidationError("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    throw new ValidationError("Password must contain at least one number");
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    throw new ValidationError("Password must contain at least one special character");
  }
};

