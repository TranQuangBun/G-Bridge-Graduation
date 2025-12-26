import { JobRequiredLanguageService } from "../services/JobRequiredLanguageService.js";
import { logError, AppError } from "../utils/Errors.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/Response.js";

const jobRequiredLanguageService = new JobRequiredLanguageService();

export async function getAllJobRequiredLanguages(req, res) {
  try {
    const data = await jobRequiredLanguageService.getAllJobRequiredLanguages(
      req.query
    );
    if (data.pagination) {
      return sendPaginated(
        res,
        data.languages || data,
        data.pagination,
        "Job required languages fetched successfully"
      );
    }
    return sendSuccess(
      res,
      data,
      "Job required languages fetched successfully"
    );
  } catch (error) {
    logError(error, "Fetching job required languages");
    return sendError(res, "Error fetching job required languages", 500, error);
  }
}

export async function getJobRequiredLanguageById(req, res) {
  try {
    const { id } = req.params;
    const language = await jobRequiredLanguageService.getJobRequiredLanguageById(
      id
    );
    return sendSuccess(
      res,
      language,
      "Job required language fetched successfully"
    );
  } catch (error) {
    if (
      error instanceof AppError ||
      error.message === "Job required language not found"
    ) {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Fetching job required language");
    return sendError(res, "Error fetching job required language", 500, error);
  }
}

export async function createJobRequiredLanguage(req, res) {
  try {
    const language =
      await jobRequiredLanguageService.createJobRequiredLanguage(req.body);
    return sendSuccess(
      res,
      language,
      "Job required language created successfully",
      201
    );
  } catch (error) {
    if (
      error instanceof AppError ||
      error.message === "Job not found" ||
      error.message === "Language not found" ||
      error.message === "Level not found" ||
      error.message === "Job required language already exists" ||
      error.message === "jobId, languageId, and levelId are required"
    ) {
      const statusCode =
        error.message === "jobId, languageId, and levelId are required"
          ? 400
          : error.message === "Job required language already exists"
          ? 409
          : 404;
      return sendError(res, error.message, statusCode);
    }
    logError(error, "Creating job required language");
    return sendError(res, "Error creating job required language", 500, error);
  }
}

export async function updateJobRequiredLanguage(req, res) {
  try {
    const { id } = req.params;
    const language =
      await jobRequiredLanguageService.updateJobRequiredLanguage(id, req.body);
    return sendSuccess(
      res,
      language,
      "Job required language updated successfully"
    );
  } catch (error) {
    if (
      error instanceof AppError ||
      error.message === "Job required language not found" ||
      error.message === "Language not found" ||
      error.message === "Level not found"
    ) {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Updating job required language");
    return sendError(res, "Error updating job required language", 500, error);
  }
}

export async function deleteJobRequiredLanguage(req, res) {
  try {
    const { id } = req.params;
    await jobRequiredLanguageService.deleteJobRequiredLanguage(id);
    return sendSuccess(
      res,
      null,
      "Job required language deleted successfully"
    );
  } catch (error) {
    if (
      error instanceof AppError ||
      error.message === "Job required language not found"
    ) {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Deleting job required language");
    return sendError(res, "Error deleting job required language", 500, error);
  }
}

