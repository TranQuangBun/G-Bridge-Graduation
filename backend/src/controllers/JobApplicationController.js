import { JobApplicationService } from "../services/JobApplicationService.js";
import { logError, AppError } from "../utils/Errors.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/Response.js";
import {
  validateCreateJobApplication,
  validateUpdateJobApplication,
} from "../validators/JobApplicationValidators.js";

const jobApplicationService = new JobApplicationService();

export async function getAllJobApplications(req, res) {
  try {
    const data = await jobApplicationService.getAllJobApplications(req.query);
    if (data.pagination) {
      return sendPaginated(
        res,
        data.applications || data,
        data.pagination,
        "Job applications fetched successfully"
      );
    }
    return sendSuccess(res, data, "Job applications fetched successfully");
  } catch (error) {
    logError(error, "Fetching job applications");
    return sendError(res, "Error fetching job applications", 500, error);
  }
}

export async function getJobApplicationById(req, res) {
  try {
    const { id } = req.params;
    const application = await jobApplicationService.getJobApplicationById(id);
    return sendSuccess(
      res,
      application,
      "Job application fetched successfully"
    );
  } catch (error) {
    if (
      error instanceof AppError ||
      error.message === "Job application not found"
    ) {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Fetching job application");
    return sendError(res, "Error fetching job application", 500, error);
  }
}

export async function createJobApplication(req, res) {
  try {
    // Validate input
    validateCreateJobApplication(req.body);

    const application = await jobApplicationService.createJobApplication(
      req.body
    );
    return sendSuccess(
      res,
      application,
      "Job application created successfully",
      201
    );
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    if (
      error.message === "Already applied to this job" ||
      error.message === "Job not found" ||
      error.message === "Interpreter not found"
    ) {
      const statusCode =
        error.message === "Already applied to this job" ? 409 : 404;
      return sendError(res, error.message, statusCode);
    }
    logError(error, "Creating job application");
    return sendError(res, "Error creating job application", 500, error);
  }
}

export async function updateJobApplication(req, res) {
  try {
    const { id } = req.params;

    // Validate input
    validateUpdateJobApplication(req.body);

    const application = await jobApplicationService.updateJobApplication(
      id,
      req.body
    );
    return sendSuccess(
      res,
      application,
      "Job application updated successfully"
    );
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    if (error.message === "Job application not found") {
      return sendError(res, error.message, 404);
    }
    logError(error, "Updating job application");
    return sendError(res, "Error updating job application", 500, error);
  }
}

export async function deleteJobApplication(req, res) {
  try {
    const { id } = req.params;
    await jobApplicationService.deleteJobApplication(id);
    return sendSuccess(res, null, "Job application deleted successfully");
  } catch (error) {
    if (
      error instanceof AppError ||
      error.message === "Job application not found"
    ) {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Deleting job application");
    return sendError(res, "Error deleting job application", 500, error);
  }
}

export async function requestJobCompletion(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.sub || req.user?.id;

    if (!userId) {
      return sendError(res, "User ID is required", 401);
    }

    const application = await jobApplicationService.requestJobCompletion(
      id,
      userId
    );
    return sendSuccess(
      res,
      application,
      "Job completion requested successfully"
    );
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    if (
      error.message === "Job application not found" ||
      error.message === "Unauthorized" ||
      error.message.includes("not approved")
    ) {
      const statusCode = error.message === "Unauthorized" ? 403 : 404;
      return sendError(res, error.message, statusCode);
    }
    logError(error, "Requesting job completion");
    return sendError(res, "Error requesting job completion", 500, error);
  }
}

export async function confirmJobCompletion(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.sub || req.user?.id;

    if (!userId) {
      return sendError(res, "User ID is required", 401);
    }

    const application = await jobApplicationService.confirmJobCompletion(
      id,
      userId
    );
    return sendSuccess(
      res,
      application,
      "Job completion confirmed successfully"
    );
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    if (
      error.message === "Job application not found" ||
      error.message === "Unauthorized" ||
      error.message.includes("not been requested")
    ) {
      const statusCode = error.message === "Unauthorized" ? 403 : 404;
      return sendError(res, error.message, statusCode);
    }
    logError(error, "Confirming job completion");
    return sendError(res, "Error confirming job completion", 500, error);
  }
}

export async function cancelJobCompletionRequest(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.sub || req.user?.id;

    if (!userId) {
      return sendError(res, "User ID is required", 401);
    }

    const application = await jobApplicationService.cancelJobCompletionRequest(
      id,
      userId
    );
    return sendSuccess(
      res,
      application,
      "Job completion request cancelled successfully"
    );
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    if (
      error.message === "Job application not found" ||
      error.message === "Unauthorized"
    ) {
      const statusCode = error.message === "Unauthorized" ? 403 : 404;
      return sendError(res, error.message, statusCode);
    }
    logError(error, "Cancelling job completion request");
    return sendError(
      res,
      "Error cancelling job completion request",
      500,
      error
    );
  }
}
