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

// User Management
export async function getAllUsers(req, res) {
  try {
    const result = await adminService.getAllUsers(req.query);
    return sendPaginated(
      res,
      result.users,
      result.pagination,
      "Users fetched successfully"
    );
  } catch (error) {
    logError(error, "Fetching users");
    return sendError(res, "Error fetching users", 500, error);
  }
}

export async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const user = await adminService.getUserById(id);
    return sendSuccess(res, user, "User fetched successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "User not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Fetching user");
    return sendError(res, "Error fetching user", 500, error);
  }
}

export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const user = await adminService.updateUser(id, req.body);
    return sendSuccess(res, user, "User updated successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "User not found" || error.message === "Email already exists") {
      const statusCode = error.statusCode || (error.message === "User not found" ? 404 : 409);
      return sendError(res, error.message, statusCode);
    }
    logError(error, "Updating user");
    return sendError(res, "Error updating user", 500, error);
  }
}

export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    await adminService.deleteUser(id);
    return sendSuccess(res, null, "User deleted successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "User not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Deleting user");
    return sendError(res, "Error deleting user", 500, error);
  }
}

export async function toggleUserStatus(req, res) {
  try {
    const { id } = req.params;
    const user = await adminService.toggleUserStatus(id);
    return sendSuccess(res, user, "User status updated successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "User not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Toggling user status");
    return sendError(res, "Error updating user status", 500, error);
  }
}

// Revenue Management
export async function getRevenueStats(req, res) {
  try {
    const stats = await adminService.getRevenueStats(req.query);
    return sendSuccess(res, stats, "Revenue stats fetched successfully");
  } catch (error) {
    logError(error, "Fetching revenue stats");
    return sendError(res, "Error fetching revenue stats", 500, error);
  }
}

export async function getAllPayments(req, res) {
  try {
    const result = await adminService.getAllPayments(req.query);
    return sendPaginated(
      res,
      result.payments,
      result.pagination,
      "Payments fetched successfully"
    );
  } catch (error) {
    logError(error, "Fetching payments");
    return sendError(res, "Error fetching payments", 500, error);
  }
}

