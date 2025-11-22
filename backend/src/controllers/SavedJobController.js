import { SavedJobService } from "../services/SavedJobService.js";
import { logError, AppError } from "../utils/Errors.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/Response.js";

const savedJobService = new SavedJobService();

export async function getAllSavedJobs(req, res) {
  try {
    const data = await savedJobService.getAllSavedJobs(req.query);
    if (data.pagination) {
      return sendPaginated(res, data.savedJobs || data, data.pagination, "Saved jobs fetched successfully");
    }
    return sendSuccess(res, data, "Saved jobs fetched successfully");
  } catch (error) {
    logError(error, "Fetching saved jobs");
    return sendError(res, "Error fetching saved jobs", 500, error);
  }
}

export async function getSavedJobById(req, res) {
  try {
    const { userId, jobId } = req.params;
    const savedJob = await savedJobService.getSavedJobById(userId, jobId);
    return sendSuccess(res, savedJob, "Saved job fetched successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Saved job not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Fetching saved job");
    return sendError(res, "Error fetching saved job", 500, error);
  }
}

export async function createSavedJob(req, res) {
  try {
    const savedJob = await savedJobService.createSavedJob(req.body);
    return sendSuccess(res, savedJob, "Job saved successfully", 201);
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    if (
      error.message === "userId and jobId are required" ||
      error.message === "Job already saved" ||
      error.message === "User not found" ||
      error.message === "Job not found"
    ) {
      const statusCode = error.message === "userId and jobId are required" ? 400 :
                        error.message === "Job already saved" ? 409 : 404;
      return sendError(res, error.message, statusCode);
    }
    logError(error, "Creating saved job");
    return sendError(res, "Error creating saved job", 500, error);
  }
}

export async function deleteSavedJob(req, res) {
  try {
    const { userId, jobId } = req.params;
    await savedJobService.deleteSavedJob(userId, jobId);
    return sendSuccess(res, null, "Job unsaved successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Saved job not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Deleting saved job");
    return sendError(res, "Error deleting saved job", 500, error);
  }
}

