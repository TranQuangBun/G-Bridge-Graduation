import { ValidationError } from "../utils/Errors.js";
import { validateRequired } from "./CommonValidators.js";

/**
 * Validate job creation data
 */
export const validateCreateJob = (data) => {
  const required = ["organizationId", "workingModeId", "title"];
  const missing = validateRequired(data, required);

  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(", ")}`);
  }

  if (data.salaryMin && data.salaryMax) {
    if (parseFloat(data.salaryMin) > parseFloat(data.salaryMax)) {
      throw new ValidationError("salaryMin cannot be greater than salaryMax");
    }
  }

  if (data.expirationDate) {
    const expirationDate = new Date(data.expirationDate);
    if (isNaN(expirationDate.getTime())) {
      throw new ValidationError("Invalid expirationDate format");
    }
    if (expirationDate < new Date()) {
      throw new ValidationError("expirationDate cannot be in the past");
    }
  }

  const validSalaryTypes = ["NEGOTIABLE", "FIXED", "RANGE"];
  if (data.salaryType && !validSalaryTypes.includes(data.salaryType)) {
    throw new ValidationError(
      `salaryType must be one of: ${validSalaryTypes.join(", ")}`
    );
  }
};

/**
 * Validate job update data
 */
export const validateUpdateJob = (data) => {
  if (data.salaryMin && data.salaryMax) {
    if (parseFloat(data.salaryMin) > parseFloat(data.salaryMax)) {
      throw new ValidationError("salaryMin cannot be greater than salaryMax");
    }
  }

  if (data.expirationDate) {
    const expirationDate = new Date(data.expirationDate);
    if (isNaN(expirationDate.getTime())) {
      throw new ValidationError("Invalid expirationDate format");
    }
  }

  const validSalaryTypes = ["NEGOTIABLE", "FIXED", "RANGE"];
  if (data.salaryType && !validSalaryTypes.includes(data.salaryType)) {
    throw new ValidationError(
      `salaryType must be one of: ${validSalaryTypes.join(", ")}`
    );
  }

  const validStatuses = ["open", "closed", "expired"];
  if (data.statusOpenStop && !validStatuses.includes(data.statusOpenStop)) {
    throw new ValidationError(
      `statusOpenStop must be one of: ${validStatuses.join(", ")}`
    );
  }
};

