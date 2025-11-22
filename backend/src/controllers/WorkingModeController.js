import { WorkingModeService } from "../services/WorkingModeService.js";
import { logError, AppError } from "../utils/Errors.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/Response.js";

const workingModeService = new WorkingModeService();

export async function getAllWorkingModes(req, res) {
  try {
    const data = await workingModeService.getAllWorkingModes(req.query);
    if (data.pagination) {
      return sendPaginated(res, data.workingModes || data, data.pagination, "Working modes fetched successfully");
    }
    return sendSuccess(res, data, "Working modes fetched successfully");
  } catch (error) {
    logError(error, "Fetching working modes");
    return sendError(res, "Error fetching working modes", 500, error);
  }
}

export async function getWorkingModeById(req, res) {
  try {
    const { id } = req.params;
    const workingMode = await workingModeService.getWorkingModeById(id);
    return sendSuccess(res, workingMode, "Working mode fetched successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Working mode not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Fetching working mode");
    return sendError(res, "Error fetching working mode", 500, error);
  }
}

export async function createWorkingMode(req, res) {
  try {
    const workingMode = await workingModeService.createWorkingMode(req.body);
    return sendSuccess(res, workingMode, "Working mode created successfully", 201);
  } catch (error) {
    logError(error, "Creating working mode");
    return sendError(res, "Error creating working mode", 500, error);
  }
}

export async function updateWorkingMode(req, res) {
  try {
    const { id } = req.params;
    const workingMode = await workingModeService.updateWorkingMode(
      id,
      req.body
    );
    return sendSuccess(res, workingMode, "Working mode updated successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Working mode not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Updating working mode");
    return sendError(res, "Error updating working mode", 500, error);
  }
}

export async function deleteWorkingMode(req, res) {
  try {
    const { id } = req.params;
    await workingModeService.deleteWorkingMode(id);
    return sendSuccess(res, null, "Working mode deleted successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Working mode not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Deleting working mode");
    return sendError(res, "Error deleting working mode", 500, error);
  }
}
