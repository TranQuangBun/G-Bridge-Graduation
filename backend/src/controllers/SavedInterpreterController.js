import { SavedInterpreterService } from "../services/SavedInterpreterService.js";
import { logError, AppError } from "../utils/Errors.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/Response.js";

const savedInterpreterService = new SavedInterpreterService();

export async function getAllSavedInterpreters(req, res) {
  try {
    const data = await savedInterpreterService.getAllSavedInterpreters(req.query);
    if (data.pagination) {
      return sendPaginated(res, data.savedInterpreters || data, data.pagination, "Saved interpreters fetched successfully");
    }
    return sendSuccess(res, data, "Saved interpreters fetched successfully");
  } catch (error) {
    logError(error, "Fetching saved interpreters");
    return sendError(res, "Error fetching saved interpreters", 500, error);
  }
}

export async function getSavedInterpreterById(req, res) {
  try {
    const { userId, interpreterId } = req.params;
    const savedInterpreter = await savedInterpreterService.getSavedInterpreterById(
      userId,
      interpreterId
    );
    return sendSuccess(res, savedInterpreter, "Saved interpreter fetched successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Saved interpreter not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Fetching saved interpreter");
    return sendError(res, "Error fetching saved interpreter", 500, error);
  }
}

export async function createSavedInterpreter(req, res) {
  try {
    const savedInterpreter = await savedInterpreterService.createSavedInterpreter(
      req.body
    );
    return sendSuccess(res, savedInterpreter, "Interpreter saved successfully", 201);
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    if (
      error.message === "userId and interpreterId are required" ||
      error.message === "Interpreter already saved" ||
      error.message === "User not found" ||
      error.message === "Interpreter not found"
    ) {
      const statusCode = error.message === "userId and interpreterId are required" ? 400 :
                        error.message === "Interpreter already saved" ? 409 : 404;
      return sendError(res, error.message, statusCode);
    }
    logError(error, "Creating saved interpreter");
    return sendError(res, "Error creating saved interpreter", 500, error);
  }
}

export async function deleteSavedInterpreter(req, res) {
  try {
    const { userId, interpreterId } = req.params;
    await savedInterpreterService.deleteSavedInterpreter(userId, interpreterId);
    return sendSuccess(res, null, "Interpreter unsaved successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Saved interpreter not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Deleting saved interpreter");
    return sendError(res, "Error deleting saved interpreter", 500, error);
  }
}
