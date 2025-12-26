import { SubscriptionPlanService } from "../services/SubscriptionPlanService.js";
import { logError, AppError } from "../utils/Errors.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/Response.js";

const subscriptionPlanService = new SubscriptionPlanService();

export async function getAllSubscriptionPlans(req, res) {
  try {
    const data = await subscriptionPlanService.getAllSubscriptionPlans(
      req.query
    );
    if (data.pagination) {
      return sendPaginated(res, data.plans || data, data.pagination, "Subscription plans fetched successfully");
    }
    return sendSuccess(res, data, "Subscription plans fetched successfully");
  } catch (error) {
    logError(error, "Fetching subscription plans");
    return sendError(res, "Error fetching subscription plans", 500, error);
  }
}

export async function getSubscriptionPlanById(req, res) {
  try {
    const { id } = req.params;
    const plan = await subscriptionPlanService.getSubscriptionPlanById(id);
    return sendSuccess(res, plan, "Subscription plan fetched successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Subscription plan not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Fetching subscription plan");
    return sendError(res, "Error fetching subscription plan", 500, error);
  }
}

export async function createSubscriptionPlan(req, res) {
  try {
    const plan = await subscriptionPlanService.createSubscriptionPlan(
      req.body
    );
    return sendSuccess(res, plan, "Subscription plan created successfully", 201);
  } catch (error) {
    logError(error, "Creating subscription plan");
    return sendError(res, "Error creating subscription plan", 500, error);
  }
}

export async function updateSubscriptionPlan(req, res) {
  try {
    const { id } = req.params;
    const plan = await subscriptionPlanService.updateSubscriptionPlan(
      id,
      req.body
    );
    return sendSuccess(res, plan, "Subscription plan updated successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Subscription plan not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Updating subscription plan");
    return sendError(res, "Error updating subscription plan", 500, error);
  }
}

export async function deleteSubscriptionPlan(req, res) {
  try {
    const { id } = req.params;
    await subscriptionPlanService.deleteSubscriptionPlan(id);
    return sendSuccess(res, null, "Subscription plan deleted successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Subscription plan not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Deleting subscription plan");
    return sendError(res, "Error deleting subscription plan", 500, error);
  }
}
