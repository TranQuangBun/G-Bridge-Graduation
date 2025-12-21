import {
  registerUser,
  loginUser,
  getUserByEmail,
  updateUserResetToken,
  getUserByResetToken,
  updateUserPassword,
  clearUserResetToken,
} from "../services/AuthService.js";
import {
  getUserById,
  updateUserBasicInfo,
  updateInterpreterProfileData,
  updateUserAvatar,
  updateClientProfileBusinessLicense,
  toggleUserActiveStatus,
} from "../services/UserProfileService.js";
import {
  validateRegistration,
  validateLogin,
} from "../validators/AuthValidators.js";
import { sendSuccess, sendError } from "../utils/Response.js";
import { AppError } from "../utils/Errors.js";
import { logger } from "../utils/Logger.js";
import { emailService } from "../utils/EmailService.js";
import { validatePassword } from "../validators/PasswordValidator.js";

export async function register(req, res) {
  try {
    // Validate input
    validateRegistration(req.body);

    // Prevent admin registration through normal registration
    // Admin accounts can only be created via environment variables and create-admin script
    if (req.body.role === "admin") {
      return sendError(
        res,
        "Admin registration is not allowed. Admin accounts are managed separately.",
        403
      );
    }

    // Register user
    const result = await registerUser(req.body);

    return sendSuccess(res, result, "Registration successful", 201);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.statusCode, err);
    }
    // Only log unexpected errors (not validation errors)
    if (err.statusCode !== 400 && err.statusCode !== 401) {
      logger.error("Registration failed", err);
    }
    return sendError(res, "Server error during registration", 500, err);
  }
}

export async function login(req, res) {
  try {
    // Validate input
    validateLogin(req.body);

    // Login user
    const result = await loginUser(req.body.email, req.body.password);

    return sendSuccess(res, result, "Login successful");
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.statusCode, err);
    }
    // Only log unexpected errors
    if (err.statusCode !== 400 && err.statusCode !== 401) {
      logger.error("Login failed", err);
    }
    return sendError(res, "Server error during login", 500, err);
  }
}

export async function me(req, res) {
  try {
    const result = await getUserById(req.user.sub);
    return sendSuccess(res, result);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.statusCode, err);
    }
    logger.error("Get user failed", err);
    return sendError(res, "Server error", 500, err);
  }
}

export async function updateUserProfile(req, res) {
  try {
    const user = await updateUserBasicInfo(req.user.sub, req.body);
    return sendSuccess(res, { user }, "Profile updated successfully");
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.statusCode, err);
    }
    logger.error("Update user profile failed", err);
    return sendError(res, "Server error", 500, err);
  }
}

export async function updateInterpreterProfile(req, res) {
  try {
    console.log("updateInterpreterProfile - Request body:", {
      body: req.body,
      specializations: req.body.specializations,
      specializationsType: typeof req.body.specializations,
      isArray: Array.isArray(req.body.specializations),
    });

    const profile = await updateInterpreterProfileData(req.user.sub, req.body);

    console.log("updateInterpreterProfile - Response profile:", {
      profileId: profile.id,
      specializations: profile.specializations,
      specializationsType: typeof profile.specializations,
      isArray: Array.isArray(profile.specializations),
    });

    return sendSuccess(
      res,
      { profile },
      "Interpreter profile updated successfully"
    );
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.statusCode, err);
    }
    logger.error("Update interpreter profile failed", err);
    return sendError(res, "Server error", 500, err);
  }
}

export async function uploadAvatar(req, res) {
  try {
    if (!req.file) {
      return sendError(res, "No file uploaded", 400);
    }

    // Build absolute URL served from /uploads
    const relativeUrl = `/uploads/avatars/${req.file.filename}`;
    const baseUrl =
      process.env.API_BASE_URL?.replace(/\/$/, "") ||
      `${req.protocol}://${req.get("host")}`;
    const avatarUrl = `${baseUrl}${relativeUrl}`;

    const user = await updateUserAvatar(req.user.sub || req.user.id, avatarUrl);

    return sendSuccess(
      res,
      { avatar: avatarUrl, user },
      "Avatar uploaded successfully"
    );
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.statusCode, err);
    }
    logger.error("Upload avatar failed", err);
    return sendError(res, "Server error", 500, err);
  }
}

export async function uploadBusinessLicense(req, res) {
  try {
    if (!req.file) {
      return sendError(res, "No file uploaded", 400);
    }

    const userId = req.user.sub || req.user.id;

    // Only clients can upload business license
    const currentUser = await getUserById(userId);
    if (currentUser.role !== "client") {
      return sendError(res, "Only clients can upload business license", 403);
    }

    // Build absolute URL served from /uploads
    const relativeUrl = `/uploads/business-licenses/${req.file.filename}`;
    const baseUrl =
      process.env.API_BASE_URL?.replace(/\/$/, "") ||
      `${req.protocol}://${req.get("host")}`;
    const licenseUrl = `${baseUrl}${relativeUrl}`;

    // Update client profile with business license
    const updatedProfile = await updateClientProfileBusinessLicense(
      userId,
      licenseUrl
    );

    return sendSuccess(
      res,
      { businessLicense: licenseUrl, profile: updatedProfile },
      "Business license uploaded successfully"
    );
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.statusCode, err);
    }
    logger.error("Upload business license failed", err);
    return sendError(res, "Server error", 500, err);
  }
}

export async function toggleActiveStatus(req, res) {
  try {
    const userId = req.user.sub || req.user.id;

    // Only interpreters can toggle their own active status
    const currentUser = await getUserById(userId);
    if (currentUser.role !== "interpreter") {
      return sendError(
        res,
        "Only interpreters can toggle their active status",
        403
      );
    }

    const user = await toggleUserActiveStatus(userId);

    return sendSuccess(
      res,
      { user },
      `Profile ${user.isActive ? "activated" : "deactivated"} successfully`
    );
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.statusCode, err);
    }
    logger.error("Toggle active status failed", err);
    return sendError(res, "Server error", 500, err);
  }
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, "Email is required", 400);
    }

    const user = await getUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return sendSuccess(
        res,
        null,
        "If an account with that email exists, a password reset link has been sent"
      );
    }

    // Generate reset token (valid for 1 hour)
    const crypto = await import("crypto");
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save reset token to user
    await updateUserResetToken(user.id, resetToken, resetTokenExpiry);

    // Build reset URL
    const resetUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/reset-password?token=${resetToken}`;

    // Send email
    const emailSent = await emailService.sendPasswordResetEmail(
      email,
      resetUrl
    );

    if (emailSent) {
      logger.info(`Password reset email sent successfully to ${email}`);
    } else {
      // If email service is not configured, log the URL for development
      logger.warn("Email service not configured. Reset URL:", resetUrl);
    }

    // Always return success to prevent email enumeration
    return sendSuccess(
      res,
      process.env.NODE_ENV === "development" && !emailSent
        ? { resetUrl }
        : null,
      "If an account with that email exists, a password reset link has been sent"
    );
  } catch (err) {
    logger.error("Forgot password failed", err);
    return sendError(res, "Server error", 500, err);
  }
}

export async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return sendError(res, "Token and new password are required", 400);
    }

    // Use strong password validation
    try {
      validatePassword(newPassword);
    } catch (error) {
      return sendError(res, error.message, 400);
    }

    // Find user by reset token
    const user = await getUserByResetToken(token);
    if (!user) {
      return sendError(res, "Invalid or expired reset token", 400);
    }

    // Update password and clear reset token
    await updateUserPassword(user.id, newPassword);
    await clearUserResetToken(user.id);

    return sendSuccess(res, null, "Password reset successfully");
  } catch (err) {
    logger.error("Reset password failed", err);
    return sendError(res, "Server error", 500, err);
  }
}
