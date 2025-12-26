import { ValidationError } from "../utils/Errors.js";
import { validateRequired } from "./CommonValidators.js";

/**
 * Validate job application creation data
 */
export const validateCreateJobApplication = (data) => {
  const required = ["jobId", "interpreterId"];
  const missing = validateRequired(data, required);

  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(", ")}`);
  }

  if (data.coverLetter && typeof data.coverLetter !== "string") {
    throw new ValidationError("coverLetter must be a string");
  }

  if (data.coverLetter && data.coverLetter.length > 5000) {
    throw new ValidationError("coverLetter cannot exceed 5000 characters");
  }
};

/**
 * Validate job application update data
 */
export const validateUpdateJobApplication = (data) => {
  const validStatuses = ["pending", "accepted", "rejected", "withdrawn"];
  if (data.status && !validStatuses.includes(data.status)) {
    throw new ValidationError(
      `status must be one of: ${validStatuses.join(", ")}`
    );
  }

  if (data.coverLetter && typeof data.coverLetter !== "string") {
    throw new ValidationError("coverLetter must be a string");
  }

  if (data.coverLetter && data.coverLetter.length > 5000) {
    throw new ValidationError("coverLetter cannot exceed 5000 characters");
  }
};

