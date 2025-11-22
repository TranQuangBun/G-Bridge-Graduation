import { JobRequiredCertificateService } from "../services/JobRequiredCertificateService.js";
import { logError, AppError } from "../utils/Errors.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/Response.js";

const jobRequiredCertificateService = new JobRequiredCertificateService();

export async function getAllJobRequiredCertificates(req, res) {
  try {
    const data =
      await jobRequiredCertificateService.getAllJobRequiredCertificates(
        req.query
      );
    if (data.pagination) {
      return sendPaginated(
        res,
        data.certificates || data,
        data.pagination,
        "Job required certificates fetched successfully"
      );
    }
    return sendSuccess(
      res,
      data,
      "Job required certificates fetched successfully"
    );
  } catch (error) {
    logError(error, "Fetching job required certificates");
    return sendError(
      res,
      "Error fetching job required certificates",
      500,
      error
    );
  }
}

export async function getJobRequiredCertificateById(req, res) {
  try {
    const { id } = req.params;
    const certificate =
      await jobRequiredCertificateService.getJobRequiredCertificateById(id);
    return sendSuccess(
      res,
      certificate,
      "Job required certificate fetched successfully"
    );
  } catch (error) {
    if (
      error instanceof AppError ||
      error.message === "Job required certificate not found"
    ) {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Fetching job required certificate");
    return sendError(
      res,
      "Error fetching job required certificate",
      500,
      error
    );
  }
}

export async function createJobRequiredCertificate(req, res) {
  try {
    const certificate =
      await jobRequiredCertificateService.createJobRequiredCertificate(
        req.body
      );
    return sendSuccess(
      res,
      certificate,
      "Job required certificate created successfully",
      201
    );
  } catch (error) {
    if (
      error instanceof AppError ||
      error.message === "Job not found" ||
      error.message === "Certification not found" ||
      error.message === "Job required certificate already exists" ||
      error.message === "jobId and certificateId are required"
    ) {
      const statusCode =
        error.message === "jobId and certificateId are required"
          ? 400
          : error.message === "Job required certificate already exists"
          ? 409
          : 404;
      return sendError(res, error.message, statusCode);
    }
    logError(error, "Creating job required certificate");
    return sendError(
      res,
      "Error creating job required certificate",
      500,
      error
    );
  }
}

export async function updateJobRequiredCertificate(req, res) {
  try {
    const { id } = req.params;
    const certificate =
      await jobRequiredCertificateService.updateJobRequiredCertificate(
        id,
        req.body
      );
    return sendSuccess(
      res,
      certificate,
      "Job required certificate updated successfully"
    );
  } catch (error) {
    if (
      error instanceof AppError ||
      error.message === "Job required certificate not found" ||
      error.message === "Certification not found"
    ) {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Updating job required certificate");
    return sendError(
      res,
      "Error updating job required certificate",
      500,
      error
    );
  }
}

export async function deleteJobRequiredCertificate(req, res) {
  try {
    const { id } = req.params;
    await jobRequiredCertificateService.deleteJobRequiredCertificate(id);
    return sendSuccess(
      res,
      null,
      "Job required certificate deleted successfully"
    );
  } catch (error) {
    if (
      error instanceof AppError ||
      error.message === "Job required certificate not found"
    ) {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Deleting job required certificate");
    return sendError(
      res,
      "Error deleting job required certificate",
      500,
      error
    );
  }
}

