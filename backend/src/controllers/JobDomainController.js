import { JobDomainService } from "../services/JobDomainService.js";
import { logError, AppError } from "../utils/Errors.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/Response.js";

const jobDomainService = new JobDomainService();

export async function getAllJobDomains(req, res) {
  try {
    const data = await jobDomainService.getAllJobDomains(req.query);
    if (data.pagination) {
      return sendPaginated(
        res,
        data.jobDomains || data,
        data.pagination,
        "Job domains fetched successfully"
      );
    }
    return sendSuccess(res, data, "Job domains fetched successfully");
  } catch (error) {
    logError(error, "Fetching job domains");
    return sendError(res, "Error fetching job domains", 500, error);
  }
}

export async function getJobDomainByJobAndDomain(req, res) {
  try {
    const { jobId, domainId } = req.params;
    const jobDomain = await jobDomainService.getJobDomainByJobAndDomain(
      jobId,
      domainId
    );
    return sendSuccess(res, jobDomain, "Job domain fetched successfully");
  } catch (error) {
    if (
      error instanceof AppError ||
      error.message === "Job domain not found"
    ) {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Fetching job domain");
    return sendError(res, "Error fetching job domain", 500, error);
  }
}

export async function createJobDomain(req, res) {
  try {
    const jobDomain = await jobDomainService.createJobDomain(req.body);
    return sendSuccess(res, jobDomain, "Job domain created successfully", 201);
  } catch (error) {
    if (
      error instanceof AppError ||
      error.message === "Job not found" ||
      error.message === "Domain not found" ||
      error.message === "Job domain already exists" ||
      error.message === "jobId and domainId are required"
    ) {
      const statusCode =
        error.message === "jobId and domainId are required"
          ? 400
          : error.message === "Job domain already exists"
          ? 409
          : 404;
      return sendError(res, error.message, statusCode);
    }
    logError(error, "Creating job domain");
    return sendError(res, "Error creating job domain", 500, error);
  }
}

export async function deleteJobDomain(req, res) {
  try {
    const { jobId, domainId } = req.params;
    await jobDomainService.deleteJobDomain(jobId, domainId);
    return sendSuccess(res, null, "Job domain deleted successfully");
  } catch (error) {
    if (
      error instanceof AppError ||
      error.message === "Job domain not found"
    ) {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Deleting job domain");
    return sendError(res, "Error deleting job domain", 500, error);
  }
}

