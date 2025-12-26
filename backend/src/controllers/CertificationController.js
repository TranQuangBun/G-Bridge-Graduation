import { CertificationService } from "../services/CertificationService.js";
import { logError, AppError } from "../utils/Errors.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/Response.js";

const certificationService = new CertificationService();

export async function getAllCertifications(req, res) {
  try {
    // Admin: no limit, no role filter
    // Interpreter: force own userId and limit 3 (unless explicitly provided)
    // Others/unauth: keep default behavior (role filter applied in service)
    const requesterRole = req.user?.role;
    const requesterId = req.user?.sub || req.user?.id;
    const isAdmin = requesterRole === "admin";
    const isInterpreter = requesterRole === "interpreter";

    const enforcedLimit =
      isInterpreter && !isAdmin && !req.query.limit ? 3 : req.query.limit;

    const result = await certificationService.getAllCertifications({
      ...req.query,
      limit: enforcedLimit,
      enforceInterpreterRole: !isAdmin,
      userId: isInterpreter ? requesterId : req.query.userId || "",
    });
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

export async function getCertificationById(req, res) {
  try {
    const { id } = req.params;
    const certification = await certificationService.getCertificationById(id);
    return sendSuccess(
      res,
      certification,
      "Certification fetched successfully"
    );
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

    const certification = await certificationService.createCertification(
      certificationData
    );

    console.log("✅ [CREATE CERTIFICATION] Created certification:", {
      id: certification.id,
      name: certification.name,
      imageUrl: certification.imageUrl,
      credentialUrl: certification.credentialUrl,
      verificationStatus: certification.verificationStatus,
      userId: certification.userId,
    });

    return sendSuccess(
      res,
      certification,
      "Certification created successfully",
      201
    );
  } catch (error) {
    console.error("❌ [CREATE CERTIFICATION] Error:", error);
    logError(error, "Creating certification");
    return sendError(res, "Error creating certification", 500, error);
  }
}

export async function updateCertification(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.sub || req.user?.id;

    // Verify that the certification belongs to the authenticated user
    const existingCertification =
      await certificationService.getCertificationById(id);
    const certificationOwnerId =
      existingCertification.user?.id || existingCertification.userId;

    if (certificationOwnerId !== parseInt(userId)) {
      return sendError(res, "You can only update your own certifications", 403);
    }

    const certification = await certificationService.updateCertification(
      id,
      req.body
    );
    return sendSuccess(
      res,
      certification,
      "Certification updated successfully"
    );
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
    const existingCertification =
      await certificationService.getCertificationById(id);
    const certificationOwnerId =
      existingCertification.user?.id || existingCertification.userId;

    if (certificationOwnerId !== parseInt(userId)) {
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

    console.log("📤 [UPLOAD CERTIFICATION IMAGE] Request:", {
      certificationId: id,
      userId,
      hasFile: !!req.file,
      fileInfo: req.file
        ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            fieldname: req.file.fieldname,
            path: req.file.path,
            filename: req.file.filename,
          }
        : null,
    });

    if (!req.file) {
      console.error("❌ [UPLOAD CERTIFICATION IMAGE] No file uploaded");
      return sendError(res, "No file uploaded", 400);
    }

    // Build absolute URL (served via /uploads)
    const relativeUrl = `/uploads/certifications/${req.file.filename}`;
    const baseUrl =
      process.env.API_BASE_URL?.replace(/\/$/, "") ||
      `${req.protocol}://${req.get("host")}`;
    const fileUrl = `${baseUrl}${relativeUrl}`;

    const certification = await certificationService.updateCertificationImage(userId, id, fileUrl);

    console.log("✅ [UPLOAD CERTIFICATION IMAGE] Saved certification:", {
      id: certification.id,
      imageUrl: certification.imageUrl,
      credentialUrl: certification.credentialUrl,
      verificationStatus: certification.verificationStatus,
      userId: certification.userId,
    });

    return sendSuccess(
      res,
      {
        certification,
        imageUrl: fileUrl,
      },
      "Certification image uploaded successfully"
    );
  } catch (error) {
    console.error("❌ [UPLOAD CERTIFICATION IMAGE] Error:", error);
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    logError(error, "Uploading certification image");
    return sendError(res, "Error uploading certification image", 500, error);
  }
}
