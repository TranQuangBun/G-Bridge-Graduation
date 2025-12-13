import { AdminService } from "../services/AdminService.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/Response.js";
import { logError, AppError } from "../utils/Errors.js";

const adminService = new AdminService();

// Certificate Approval
export async function getPendingCertifications(req, res) {
  try {
    const result = await adminService.getPendingCertifications(req.query);
    return sendPaginated(
      res,
      result.certifications,
      result.pagination,
      "Certifications fetched successfully"
    );
  } catch (error) {
    logError(error, "Fetching certifications");
    return sendError(res, "Error fetching certifications", 500, error);
  }
}

export async function approveCertification(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user?.sub || req.user?.id;
    const certification = await adminService.approveCertification(id, adminId);
    return sendSuccess(
      res,
      certification,
      "Certification approved successfully"
    );
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Approving certification");
    return sendError(res, "Error approving certification", 500, error);
  }
}

export async function rejectCertification(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user?.sub || req.user?.id;
    const { reason } = req.body;
    const certification = await adminService.rejectCertification(
      id,
      adminId,
      reason
    );
    return sendSuccess(
      res,
      certification,
      "Certification rejected successfully"
    );
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Rejecting certification");
    return sendError(res, "Error rejecting certification", 500, error);
  }
}

// Organization Approval
export async function getPendingOrganizations(req, res) {
  try {
    const result = await adminService.getPendingOrganizations(req.query);
    return sendPaginated(
      res,
      result.organizations,
      result.pagination,
      "Pending organizations fetched successfully"
    );
  } catch (error) {
    logError(error, "Fetching pending organizations");
    return sendError(res, "Error fetching pending organizations", 500, error);
  }
}

export async function approveOrganization(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user?.sub || req.user?.id;
    const organization = await adminService.approveOrganization(id, adminId);
    return sendSuccess(res, organization, "Organization approved successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Approving organization");
    return sendError(res, "Error approving organization", 500, error);
  }
}

export async function rejectOrganization(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user?.sub || req.user?.id;
    const { reason } = req.body;
    const organization = await adminService.rejectOrganization(
      id,
      adminId,
      reason
    );
    return sendSuccess(res, organization, "Organization rejected successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Rejecting organization");
    return sendError(res, "Error rejecting organization", 500, error);
  }
}

// System Notifications
export async function createSystemNotification(req, res) {
  try {
    const { title, message, recipientIds, metadata } = req.body;
    const result = await adminService.createSystemNotification({
      title,
      message,
      recipientIds,
      metadata,
    });
    return sendSuccess(
      res,
      result,
      `System notification sent to ${result.count} user(s)`,
      201
    );
  } catch (error) {
    logError(error, "Creating system notification");
    return sendError(
      res,
      error.message || "Error creating system notification",
      500,
      error
    );
  }
}

// Dashboard Stats
export async function getDashboardStats(req, res) {
  try {
    const stats = await adminService.getDashboardStats();
    return sendSuccess(res, stats, "Dashboard stats fetched successfully");
  } catch (error) {
    logError(error, "Fetching dashboard stats");
    return sendError(res, "Error fetching dashboard stats", 500, error);
  }
}
