import { LevelService } from "../services/LevelService.js";
import { logError, AppError } from "../utils/Errors.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/Response.js";

const levelService = new LevelService();

export async function getAllLevels(req, res) {
  try {
    const data = await levelService.getAllLevels(req.query);
    if (data.pagination) {
      return sendPaginated(res, data.levels || data, data.pagination, "Levels fetched successfully");
    }
    return sendSuccess(res, data, "Levels fetched successfully");
  } catch (error) {
    logError(error, "Fetching levels");
    return sendError(res, "Error fetching levels", 500, error);
  }
}

export async function getLevelById(req, res) {
  try {
    const { id } = req.params;
    const level = await levelService.getLevelById(id);
    return sendSuccess(res, level, "Level fetched successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Level not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Fetching level");
    return sendError(res, "Error fetching level", 500, error);
  }
}

export async function createLevel(req, res) {
  try {
    const level = await levelService.createLevel(req.body);
    return sendSuccess(res, level, "Level created successfully", 201);
  } catch (error) {
    logError(error, "Creating level");
    return sendError(res, "Error creating level", 500, error);
  }
}

export async function updateLevel(req, res) {
  try {
    const { id } = req.params;
    const level = await levelService.updateLevel(id, req.body);
    return sendSuccess(res, level, "Level updated successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Level not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Updating level");
    return sendError(res, "Error updating level", 500, error);
  }
}

export async function deleteLevel(req, res) {
  try {
    const { id } = req.params;
    await levelService.deleteLevel(id);
    return sendSuccess(res, null, "Level deleted successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Level not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Deleting level");
    return sendError(res, "Error deleting level", 500, error);
  }
}
