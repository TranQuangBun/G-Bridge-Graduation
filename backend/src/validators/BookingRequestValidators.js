import { ValidationError } from "../utils/Errors.js";
import { validateRequired } from "./CommonValidators.js";

/**
 * Validate booking request creation data
 */
export const validateCreateBookingRequest = (data) => {
  const required = ["clientId", "interpreterId", "serviceType", "bookingType"];
  const missing = validateRequired(data, required);

  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(", ")}`);
  }

  const validServiceTypes = ["interpreting", "translation", "consultation"];
  if (!validServiceTypes.includes(data.serviceType)) {
    throw new ValidationError(
      `serviceType must be one of: ${validServiceTypes.join(", ")}`
    );
  }

  const validBookingTypes = ["online", "offline"];
  if (!validBookingTypes.includes(data.bookingType)) {
    throw new ValidationError(
      `bookingType must be one of: ${validBookingTypes.join(", ")}`
    );
  }

  if (data.bookingType === "offline" && !data.location) {
    throw new ValidationError("location is required for offline bookings");
  }

  if (data.eventDate) {
    const eventDate = new Date(data.eventDate);
    if (isNaN(eventDate.getTime())) {
      throw new ValidationError("Invalid eventDate format");
    }
    if (eventDate < new Date()) {
      throw new ValidationError("eventDate cannot be in the past");
    }
  }
};

/**
 * Validate booking request update data
 */
export const validateUpdateBookingRequest = (data) => {
  const validStatuses = ["pending", "accepted", "rejected", "completed", "cancelled"];
  if (data.status && !validStatuses.includes(data.status)) {
    throw new ValidationError(
      `status must be one of: ${validStatuses.join(", ")}`
    );
  }

  const validServiceTypes = ["interpreting", "translation", "consultation"];
  if (data.serviceType && !validServiceTypes.includes(data.serviceType)) {
    throw new ValidationError(
      `serviceType must be one of: ${validServiceTypes.join(", ")}`
    );
  }

  const validBookingTypes = ["online", "offline"];
  if (data.bookingType && !validBookingTypes.includes(data.bookingType)) {
    throw new ValidationError(
      `bookingType must be one of: ${validBookingTypes.join(", ")}`
    );
  }

  if (data.eventDate) {
    const eventDate = new Date(data.eventDate);
    if (isNaN(eventDate.getTime())) {
      throw new ValidationError("Invalid eventDate format");
    }
  }
};

