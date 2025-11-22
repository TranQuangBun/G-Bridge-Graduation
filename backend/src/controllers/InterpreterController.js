import {
  getInterpretersWithFilters,
  getInterpreterById,
  getAvailableLanguagesForFilter,
  getAvailableSpecializationsForFilter,
} from "../services/InterpreterService.js";
import { sendSuccess, sendError } from "../utils/Response.js";
import { AppError } from "../utils/Errors.js";

export const getInterpreters = async (req, res) => {
  try {
    const result = await getInterpretersWithFilters(req.query);

    return sendSuccess(res, result, "Interpreters fetched successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode, error);
    }
    return sendError(res, "Failed to fetch interpreters", 500, error);
  }
};

export const getInterpreterByIdHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const interpreter = await getInterpreterById(id);

    return sendSuccess(res, interpreter, "Interpreter fetched successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode, error);
    }
    return sendError(res, "Failed to fetch interpreter details", 500, error);
  }
};

export const getAvailableLanguages = async (req, res) => {
  try {
    const languages = await getAvailableLanguagesForFilter();
    return sendSuccess(res, languages, "Languages fetched successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode, error);
    }
    return sendError(res, "Failed to fetch languages", 500, error);
  }
};

export const getAvailableSpecializations = async (req, res) => {
  try {
    const specializations = await getAvailableSpecializationsForFilter();
    return sendSuccess(res, specializations, "Specializations fetched successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode, error);
    }
    return sendError(res, "Failed to fetch specializations", 500, error);
  }
};
