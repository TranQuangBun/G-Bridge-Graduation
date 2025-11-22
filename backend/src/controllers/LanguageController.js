import { LanguageService } from "../services/LanguageService.js";
import { logError, AppError } from "../utils/Errors.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/Response.js";

const languageService = new LanguageService();

export async function getAllLanguages(req, res) {
  try {
    const result = await languageService.getAllLanguages(req.query);
    return sendPaginated(res, result.languages, result.pagination, "Languages fetched successfully");
  } catch (error) {
    logError(error, "Fetching languages");
    return sendError(res, "Error fetching languages", 500, error);
  }
}

export async function getLanguageById(req, res) {
  try {
    const { id } = req.params;
    const language = await languageService.getLanguageById(id);
    return sendSuccess(res, language, "Language fetched successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Fetching language");
    return sendError(res, "Error fetching language", 500, error);
  }
}

export async function createLanguage(req, res) {
  try {
    // Get userId from authenticated user
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      return sendError(res, "User not authenticated", 401);
    }

    // Add userId to the request body
    const languageData = {
      ...req.body,
      userId: parseInt(userId),
    };

    const language = await languageService.createLanguage(languageData);
    return sendSuccess(res, language, "Language created successfully", 201);
  } catch (error) {
    logError(error, "Creating language");
    return sendError(res, "Error creating language", 500, error);
  }
}

export async function updateLanguage(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.sub || req.user?.id;

    // Verify that the language belongs to the authenticated user
    const existingLanguage = await languageService.getLanguageById(id);
    if (existingLanguage.userId !== parseInt(userId)) {
      return sendError(res, "You can only update your own languages", 403);
    }

    const language = await languageService.updateLanguage(id, req.body);
    return sendSuccess(res, language, "Language updated successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Updating language");
    return sendError(res, "Error updating language", 500, error);
  }
}

export async function deleteLanguage(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.sub || req.user?.id;

    // Verify that the language belongs to the authenticated user
    const existingLanguage = await languageService.getLanguageById(id);
    if (existingLanguage.userId !== parseInt(userId)) {
      return sendError(res, "You can only delete your own languages", 403);
    }

    await languageService.deleteLanguage(id);
    return sendSuccess(res, null, "Language deleted successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Deleting language");
    return sendError(res, "Error deleting language", 500, error);
  }
}
