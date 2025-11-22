import { DomainService } from "../services/DomainService.js";
import { logError, AppError } from "../utils/Errors.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/Response.js";

const domainService = new DomainService();

export async function getAllDomains(req, res) {
  try {
    const data = await domainService.getAllDomains(req.query);
    if (data.pagination) {
      return sendPaginated(res, data.domains || data, data.pagination, "Domains fetched successfully");
    }
    return sendSuccess(res, data, "Domains fetched successfully");
  } catch (error) {
    logError(error, "Fetching domains");
    return sendError(res, "Error fetching domains", 500, error);
  }
}

export async function getDomainById(req, res) {
  try {
    const { id } = req.params;
    const domain = await domainService.getDomainById(id);
    return sendSuccess(res, domain, "Domain fetched successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Domain not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Fetching domain");
    return sendError(res, "Error fetching domain", 500, error);
  }
}

export async function createDomain(req, res) {
  try {
    const domain = await domainService.createDomain(req.body);
    return sendSuccess(res, domain, "Domain created successfully", 201);
  } catch (error) {
    logError(error, "Creating domain");
    return sendError(res, "Error creating domain", 500, error);
  }
}

export async function updateDomain(req, res) {
  try {
    const { id } = req.params;
    const domain = await domainService.updateDomain(id, req.body);
    return sendSuccess(res, domain, "Domain updated successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Domain not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Updating domain");
    return sendError(res, "Error updating domain", 500, error);
  }
}

export async function deleteDomain(req, res) {
  try {
    const { id } = req.params;
    await domainService.deleteDomain(id);
    return sendSuccess(res, null, "Domain deleted successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Domain not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Deleting domain");
    return sendError(res, "Error deleting domain", 500, error);
  }
}
