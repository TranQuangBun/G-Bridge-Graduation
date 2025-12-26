import { InterpreterProfileService } from "../services/InterpreterProfileService.js";
import { logError, AppError } from "../utils/Errors.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/Response.js";

const interpreterProfileService = new InterpreterProfileService();

export async function getAllInterpreterProfiles(req, res) {
  try {
    const data = await interpreterProfileService.getAllInterpreterProfiles(
      req.query
    );
    if (data.pagination) {
      return sendPaginated(res, data.profiles || data, data.pagination, "Interpreter profiles fetched successfully");
    }
    return sendSuccess(res, data, "Interpreter profiles fetched successfully");
  } catch (error) {
    logError(error, "Fetching interpreter profiles");
    return sendError(res, "Error fetching interpreter profiles", 500, error);
  }
}

export async function getInterpreterProfileById(req, res) {
  try {
    const { id } = req.params;
    const profile = await interpreterProfileService.getInterpreterProfileById(
      id
    );
    return sendSuccess(res, profile, "Interpreter profile fetched successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Interpreter profile not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Fetching interpreter profile");
    return sendError(res, "Error fetching interpreter profile", 500, error);
  }
}

export async function createInterpreterProfile(req, res) {
  try {
    const profile = await interpreterProfileService.createInterpreterProfile(
      req.body
    );
    return sendSuccess(res, profile, "Interpreter profile created successfully", 201);
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    if (
      error.message === "userId is required" ||
      error.message === "User not found or is not an interpreter" ||
      error.message === "Interpreter profile already exists for this user"
    ) {
      const statusCode = error.message === "userId is required" ? 400 : 
                        error.message === "Interpreter profile already exists for this user" ? 409 : 404;
      return sendError(res, error.message, statusCode);
    }
    logError(error, "Creating interpreter profile");
    return sendError(res, "Error creating interpreter profile", 500, error);
  }
}

export async function updateInterpreterProfile(req, res) {
  try {
    const { id } = req.params;
    const profile = await interpreterProfileService.updateInterpreterProfile(
      id,
      req.body
    );
    return sendSuccess(res, profile, "Interpreter profile updated successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Interpreter profile not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Updating interpreter profile");
    return sendError(res, "Error updating interpreter profile", 500, error);
  }
}

export async function deleteInterpreterProfile(req, res) {
  try {
    const { id } = req.params;
    await interpreterProfileService.deleteInterpreterProfile(id);
    return sendSuccess(res, null, "Interpreter profile deleted successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Interpreter profile not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Deleting interpreter profile");
    return sendError(res, "Error deleting interpreter profile", 500, error);
  }
}
