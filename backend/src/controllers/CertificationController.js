import { CertificationService } from "../services/CertificationService.js";
import { uploadMulterFileToImgbb } from "../utils/ImgbbService.js";
import { logError, AppError } from "../utils/Errors.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/Response.js";

const certificationService = new CertificationService();

export async function getAllCertifications(req, res) {
  try {
    const result = await certificationService.getAllCertifications(req.query);
    return sendPaginated(res, result.certifications, result.pagination, "Certifications fetched successfully");
  } catch (error) {
    logError(error, "Fetching certifications");
    return sendError(res, "Error fetching certifications", 500, error);
  }
}

export async function getCertificationById(req, res) {
  try {
    const { id } = req.params;
    const certification = await certificationService.getCertificationById(id);
    return sendSuccess(res, certification, "Certification fetched successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Fetching certification");
    return sendError(res, "Error fetching certification", 500, error);
  }
}

export async function createCertification(req, res) {
  try {
    // Get userId from authenticated user
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      return sendError(res, "User not authenticated", 401);
    }

    // Add userId to the request body
    const certificationData = {
      ...req.body,
      userId: parseInt(userId),
    };

    const certification = await certificationService.createCertification(certificationData);
    return sendSuccess(res, certification, "Certification created successfully", 201);
  } catch (error) {
    logError(error, "Creating certification");
    return sendError(res, "Error creating certification", 500, error);
  }
}

export async function updateCertification(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.sub || req.user?.id;

    // Verify that the certification belongs to the authenticated user
    const existingCertification = await certificationService.getCertificationById(id);
    if (existingCertification.userId !== parseInt(userId)) {
      return sendError(res, "You can only update your own certifications", 403);
    }

    const certification = await certificationService.updateCertification(id, req.body);
    return sendSuccess(res, certification, "Certification updated successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Updating certification");
    return sendError(res, "Error updating certification", 500, error);
  }
}

export async function deleteCertification(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.sub || req.user?.id;

    // Verify that the certification belongs to the authenticated user
    const existingCertification = await certificationService.getCertificationById(id);
    if (existingCertification.userId !== parseInt(userId)) {
      return sendError(res, "You can only delete your own certifications", 403);
    }

    await certificationService.deleteCertification(id);
    return sendSuccess(res, null, "Certification deleted successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Deleting certification");
    return sendError(res, "Error deleting certification", 500, error);
  }
}

export async function uploadCertificationImage(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.sub || req.user?.id;

    if (!req.file) {
      return sendError(res, "No file uploaded", 400);
    }

    const result = await uploadMulterFileToImgbb(req.file, "certifications");
    const certification = await certificationService.updateCertificationImage(
      userId,
      id,
      result.url
    );

    return sendSuccess(res, {
      certification,
      imageUrl: result.url,
    }, "Certification image uploaded successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    logError(error, "Uploading certification image");
    return sendError(res, "Error uploading certification image", 500, error);
  }
}
