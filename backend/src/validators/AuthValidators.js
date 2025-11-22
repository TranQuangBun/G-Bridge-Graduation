import { ValidationError } from "../utils/Errors.js";
import { isValidEmail, validateRequired, isValidRole } from "./CommonValidators.js";

/**
 * Validate registration data
 */
export const validateRegistration = (data) => {
  const required = ["fullName", "email", "password", "role"];
  const missing = validateRequired(data, required);

  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(", ")}`);
  }

  if (!isValidEmail(data.email)) {
    throw new ValidationError("Invalid email format");
  }

  if (!isValidRole(data.role)) {
    throw new ValidationError("Invalid role specified");
  }

  if (data.password && data.password.length < 6) {
    throw new ValidationError("Password must be at least 6 characters");
  }

  // Additional validation for client role
  if (data.role === "client") {
    const clientRequired = ["companyName", "companyType"];
    const clientMissing = validateRequired(data, clientRequired);
    if (clientMissing.length > 0) {
      throw new ValidationError(
        `Company name and type are required for client registration`
      );
    }
  }
};

/**
 * Validate login data
 */
export const validateLogin = (data) => {
  const required = ["email", "password"];
  const missing = validateRequired(data, required);

  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(", ")}`);
  }

  if (!isValidEmail(data.email)) {
    throw new ValidationError("Invalid email format");
  }
};

