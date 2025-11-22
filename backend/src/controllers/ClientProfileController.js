import { ClientProfileService } from "../services/ClientProfileService.js";
import { logError, AppError } from "../utils/Errors.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/Response.js";

const clientProfileService = new ClientProfileService();

export async function getAllClientProfiles(req, res) {
  try {
    const data = await clientProfileService.getAllClientProfiles(req.query);
    if (data.pagination) {
      return sendPaginated(res, data.profiles || data, data.pagination, "Client profiles fetched successfully");
    }
    return sendSuccess(res, data, "Client profiles fetched successfully");
  } catch (error) {
    logError(error, "Fetching client profiles");
    return sendError(res, "Error fetching client profiles", 500, error);
  }
}

export async function getClientProfileById(req, res) {
  try {
    const { id } = req.params;
    const profile = await clientProfileService.getClientProfileById(id);
    return sendSuccess(res, profile, "Client profile fetched successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Client profile not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Fetching client profile");
    return sendError(res, "Error fetching client profile", 500, error);
  }
}

export async function createClientProfile(req, res) {
  try {
    const profile = await clientProfileService.createClientProfile(req.body);
    return sendSuccess(res, profile, "Client profile created successfully", 201);
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    if (
      error.message === "userId is required" ||
      error.message === "User not found or is not a client" ||
      error.message === "Client profile already exists for this user"
    ) {
      const statusCode = error.message === "userId is required" ? 400 :
                        error.message === "Client profile already exists for this user" ? 409 : 404;
      return sendError(res, error.message, statusCode);
    }
    logError(error, "Creating client profile");
    return sendError(res, "Error creating client profile", 500, error);
  }
}

export async function updateClientProfile(req, res) {
  try {
    const { id } = req.params;
    const profile = await clientProfileService.updateClientProfile(
      id,
      req.body
    );
    return sendSuccess(res, profile, "Client profile updated successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Client profile not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Updating client profile");
    return sendError(res, "Error updating client profile", 500, error);
  }
}

export async function deleteClientProfile(req, res) {
  try {
    const { id } = req.params;
    await clientProfileService.deleteClientProfile(id);
    return sendSuccess(res, null, "Client profile deleted successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Client profile not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Deleting client profile");
    return sendError(res, "Error deleting client profile", 500, error);
  }
}
