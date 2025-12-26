import { BookingRequestService } from "../services/BookingRequestService.js";
import { logError, AppError } from "../utils/Errors.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/Response.js";
import { validateCreateBookingRequest, validateUpdateBookingRequest } from "../validators/BookingRequestValidators.js";

const bookingRequestService = new BookingRequestService();

export async function getAllBookingRequests(req, res) {
  try {
    const data = await bookingRequestService.getAllBookingRequests(req.query);
    if (data.pagination) {
      return sendPaginated(res, data.bookingRequests || data, data.pagination, "Booking requests fetched successfully");
    }
    return sendSuccess(res, data, "Booking requests fetched successfully");
  } catch (error) {
    logError(error, "Fetching booking requests");
    return sendError(res, "Error fetching booking requests", 500, error);
  }
}

export async function getBookingRequestById(req, res) {
  try {
    const { id } = req.params;
    const bookingRequest = await bookingRequestService.getBookingRequestById(
      id
    );
    return sendSuccess(res, bookingRequest, "Booking request fetched successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Booking request not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Fetching booking request");
    return sendError(res, "Error fetching booking request", 500, error);
  }
}

export async function createBookingRequest(req, res) {
  try {
    // Validate input
    validateCreateBookingRequest(req.body);

    const bookingRequest = await bookingRequestService.createBookingRequest(
      req.body
    );
    return sendSuccess(res, bookingRequest, "Booking request created successfully", 201);
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    if (
      error.message === "Client not found" ||
      error.message === "Interpreter not found"
    ) {
      return sendError(res, error.message, 404);
    }
    logError(error, "Creating booking request");
    return sendError(res, "Error creating booking request", 500, error);
  }
}

export async function updateBookingRequest(req, res) {
  try {
    const { id } = req.params;
    
    // Validate input
    validateUpdateBookingRequest(req.body);

    const bookingRequest = await bookingRequestService.updateBookingRequest(
      id,
      req.body
    );
    return sendSuccess(res, bookingRequest, "Booking request updated successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    if (error.message === "Booking request not found") {
      return sendError(res, error.message, 404);
    }
    logError(error, "Updating booking request");
    return sendError(res, "Error updating booking request", 500, error);
  }
}

export async function deleteBookingRequest(req, res) {
  try {
    const { id } = req.params;
    await bookingRequestService.deleteBookingRequest(id);
    return sendSuccess(res, null, "Booking request deleted successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Booking request not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Deleting booking request");
    return sendError(res, "Error deleting booking request", 500, error);
  }
}
