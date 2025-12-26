import { UserService } from "../services/UserService.js";
import { logError, AppError } from "../utils/Errors.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/Response.js";

const userService = new UserService();

export async function getAllUsers(req, res) {
  try {
    const data = await userService.getAllUsers(req.query);
    if (data.pagination) {
      return sendPaginated(res, data.users || data, data.pagination, "Users fetched successfully");
    }
    return sendSuccess(res, data, "Users fetched successfully");
  } catch (error) {
    logError(error, "Fetching users");
    return sendError(res, "Error fetching users", 500, error);
  }
}

export async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    return sendSuccess(res, user, "User fetched successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "User not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Fetching user");
    return sendError(res, "Error fetching user", 500, error);
  }
}

export async function createUser(req, res) {
  try {
    const user = await userService.createUser(req.body);
    return sendSuccess(res, user, "User created successfully", 201);
  } catch (error) {
    if (error instanceof AppError || error.message === "Email already exists") {
      return sendError(res, error.message, error.statusCode || 409);
    }
    logError(error, "Creating user");
    return sendError(res, "Error creating user", 500, error);
  }
}

export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const user = await userService.updateUser(id, req.body);
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
    await userService.deleteUser(id);
    return sendSuccess(res, null, "User deleted successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "User not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Deleting user");
    return sendError(res, "Error deleting user", 500, error);
  }
}

