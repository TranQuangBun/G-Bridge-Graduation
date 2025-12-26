import { OrganizationService } from "../services/OrganizationService.js";
import { logError, AppError } from "../utils/Errors.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/Response.js";

const organizationService = new OrganizationService();

export async function getAllOrganizations(req, res) {
  try {
    const data = await organizationService.getAllOrganizations(req.query);
    if (data.pagination) {
      return sendPaginated(
        res,
        data.organizations || data,
        data.pagination,
        "Organizations fetched successfully"
      );
    }
    return sendSuccess(res, data, "Organizations fetched successfully");
  } catch (error) {
    logError(error, "Fetching organizations");
    return sendError(res, "Error fetching organizations", 500, error);
  }
}

export async function getOrganizationById(req, res) {
  try {
    const { id } = req.params;
    const organization = await organizationService.getOrganizationById(id);
    return sendSuccess(res, organization, "Organization fetched successfully");
  } catch (error) {
    if (
      error instanceof AppError ||
      error.message === "Organization not found"
    ) {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Fetching organization");
    return sendError(res, "Error fetching organization", 500, error);
  }
}

export async function createOrganization(req, res) {
  try {
    const ownerUserId = req.user?.sub || req.user?.id || req.body.ownerUserId;
    const data = {
      ...req.body,
      ownerUserId: ownerUserId || null,
    };

    // Validate ownerUserId before passing to service
    // Service will handle further validation and user existence check
    if (data.ownerUserId) {
      const parsedId = parseInt(data.ownerUserId);
      if (!Number.isInteger(parsedId) || isNaN(parsedId) || parsedId <= 0) {
        console.warn(
          `Invalid ownerUserId in request: ${data.ownerUserId}, setting to null`
        );
        data.ownerUserId = null;
      } else {
        data.ownerUserId = parsedId;
      }
    }

    const organization = await organizationService.createOrganization(data);
    return sendSuccess(
      res,
      organization,
      "Organization created successfully",
      201
    );
  } catch (error) {
    logError(error, "Creating organization");
    return sendError(res, "Error creating organization", 500, error);
  }
}

export async function updateOrganization(req, res) {
  try {
    const { id } = req.params;
    const organization = await organizationService.updateOrganization(
      id,
      req.body
    );
    return sendSuccess(res, organization, "Organization updated successfully");
  } catch (error) {
    if (
      error instanceof AppError ||
      error.message === "Organization not found"
    ) {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Updating organization");
    return sendError(res, "Error updating organization", 500, error);
  }
}

export async function deleteOrganization(req, res) {
  try {
    const { id } = req.params;
    await organizationService.deleteOrganization(id);
    return sendSuccess(res, null, "Organization deleted successfully");
  } catch (error) {
    if (
      error instanceof AppError ||
      error.message === "Organization not found"
    ) {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Deleting organization");
    return sendError(res, "Error deleting organization", 500, error);
  }
}

export async function uploadOrganizationLicense(req, res) {
  try {
    const { id } = req.params;

    if (!req.file) {
      return sendError(res, "No file uploaded", 400);
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const licenseUrl = `${baseUrl}/uploads/business-licenses/${req.file.filename}`;

    const organization = await organizationService.updateOrganizationLicense(
      id,
      licenseUrl
    );

    return sendSuccess(
      res,
      organization,
      "Business license uploaded successfully"
    );
  } catch (error) {
    if (
      error instanceof AppError ||
      error.message === "Organization not found"
    ) {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Uploading organization license");
    return sendError(res, "Error uploading organization license", 500, error);
  }
}
