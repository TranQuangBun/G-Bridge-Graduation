import { registerUser, loginUser } from "../services/AuthService.js";
import {
  getUserById,
  updateUserBasicInfo,
  updateInterpreterProfileData,
  updateUserAvatar,
  toggleUserActiveStatus,
} from "../services/UserProfileService.js";
import { validateRegistration, validateLogin } from "../validators/AuthValidators.js";
import { sendSuccess, sendError } from "../utils/Response.js";
import { AppError } from "../utils/Errors.js";
import { logger } from "../utils/Logger.js";

export async function register(req, res) {
  try {
    // Validate input
    validateRegistration(req.body);

    // Prevent admin registration through normal registration
    if (req.body.role === "admin") {
      return sendError(res, "Admin registration is not allowed through this endpoint. Please use /api/auth/register-admin", 403);
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

export async function registerAdmin(req, res) {
  try {
    // Validate input
    validateRegistration(req.body);

    // Ensure role is admin
    req.body.role = "admin";
    
    // Register admin user
    const result = await registerUser({
      ...req.body,
      isVerified: true, // Admin accounts are auto-verified
    });

    return sendSuccess(res, result, "Admin registration successful", 201);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.statusCode, err);
    }
    logger.error("Admin registration failed", err);
    return sendError(res, "Server error during admin registration", 500, err);
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
      isArray: Array.isArray(req.body.specializations)
    });
    
    const profile = await updateInterpreterProfileData(req.user.sub, req.body);
    
    console.log("updateInterpreterProfile - Response profile:", {
      profileId: profile.id,
      specializations: profile.specializations,
      specializationsType: typeof profile.specializations,
      isArray: Array.isArray(profile.specializations)
    });
    
    return sendSuccess(res, { profile }, "Interpreter profile updated successfully");
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

    return sendSuccess(res, { avatar: avatarUrl, user }, "Avatar uploaded successfully");
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.statusCode, err);
    }
    logger.error("Upload avatar failed", err);
    return sendError(res, "Server error", 500, err);
  }
}

export async function toggleActiveStatus(req, res) {
  try {
    const userId = req.user.sub || req.user.id;
    
    // Only interpreters can toggle their own active status
    const currentUser = await getUserById(userId);
    if (currentUser.role !== "interpreter") {
      return sendError(res, "Only interpreters can toggle their active status", 403);
    }

    const user = await toggleUserActiveStatus(userId);

    return sendSuccess(res, { user }, `Profile ${user.isActive ? "activated" : "deactivated"} successfully`);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.message, err.statusCode, err);
    }
    logger.error("Toggle active status failed", err);
    return sendError(res, "Server error", 500, err);
  }
}
