import { UserSubscriptionService } from "../services/UserSubscriptionService.js";
import { logError, AppError } from "../utils/Errors.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/Response.js";

const userSubscriptionService = new UserSubscriptionService();

export async function getAllUserSubscriptions(req, res) {
  try {
    const data = await userSubscriptionService.getAllUserSubscriptions(req.query);
    if (data.pagination) {
      return sendPaginated(res, data.subscriptions || data, data.pagination, "User subscriptions fetched successfully");
    }
    return sendSuccess(res, data, "User subscriptions fetched successfully");
  } catch (error) {
    logError(error, "Fetching user subscriptions");
    return sendError(res, "Error fetching user subscriptions", 500, error);
  }
}

export async function getUserSubscriptionById(req, res) {
  try {
    const { id } = req.params;
    const subscription = await userSubscriptionService.getUserSubscriptionById(id);
    return sendSuccess(res, subscription, "User subscription fetched successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "User subscription not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Fetching user subscription");
    return sendError(res, "Error fetching user subscription", 500, error);
  }
}

export async function getUserSubscriptionByUserId(req, res) {
  try {
    const { userId } = req.params;
    const subscription = await userSubscriptionService.getUserSubscriptionByUserId(
      userId
    );
    return sendSuccess(res, subscription, "User subscription fetched successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "User subscription not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Fetching user subscription");
    return sendError(res, "Error fetching user subscription", 500, error);
  }
}

export async function createUserSubscription(req, res) {
  try {
    const subscription = await userSubscriptionService.createUserSubscription(
      req.body
    );
    return sendSuccess(res, subscription, "User subscription created successfully", 201);
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    if (
      error.message === "userId, planId, startDate, and endDate are required" ||
      error.message === "User already has an active subscription" ||
      error.message === "User not found" ||
      error.message === "Subscription plan not found"
    ) {
      const statusCode = error.message === "userId, planId, startDate, and endDate are required" ? 400 :
                        error.message === "User already has an active subscription" ? 409 : 404;
      return sendError(res, error.message, statusCode);
    }
    logError(error, "Creating user subscription");
    return sendError(res, "Error creating user subscription", 500, error);
  }
}

export async function updateUserSubscription(req, res) {
  try {
    const { id } = req.params;
    const subscription = await userSubscriptionService.updateUserSubscription(
      id,
      req.body
    );
    return sendSuccess(res, subscription, "User subscription updated successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "User subscription not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Updating user subscription");
    return sendError(res, "Error updating user subscription", 500, error);
  }
}

export async function cancelUserSubscription(req, res) {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;
    const subscription = await userSubscriptionService.cancelUserSubscription(
      id,
      cancellationReason
    );
    return sendSuccess(res, subscription, "User subscription cancelled successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "User subscription not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Cancelling user subscription");
    return sendError(res, "Error cancelling user subscription", 500, error);
  }
}
