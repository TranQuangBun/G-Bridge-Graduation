import { PaymentWebhookService } from "../services/PaymentWebhookService.js";
import { logError, AppError } from "../utils/Errors.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/Response.js";

const paymentWebhookService = new PaymentWebhookService();

export async function getAllPaymentWebhooks(req, res) {
  try {
    const data = await paymentWebhookService.getAllPaymentWebhooks(req.query);
    if (data.pagination) {
      return sendPaginated(res, data.webhooks || data, data.pagination, "Payment webhooks fetched successfully");
    }
    return sendSuccess(res, data, "Payment webhooks fetched successfully");
  } catch (error) {
    logError(error, "Fetching payment webhooks");
    return sendError(res, "Error fetching payment webhooks", 500, error);
  }
}

export async function getPaymentWebhookById(req, res) {
  try {
    const { id } = req.params;
    const webhook = await paymentWebhookService.getPaymentWebhookById(id);
    return sendSuccess(res, webhook, "Payment webhook fetched successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Payment webhook not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Fetching payment webhook");
    return sendError(res, "Error fetching payment webhook", 500, error);
  }
}

export async function createPaymentWebhook(req, res) {
  try {
    const webhook = await paymentWebhookService.createPaymentWebhook(
      req.body,
      req.ip
    );
    return sendSuccess(res, webhook, "Payment webhook created successfully", 201);
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    if (error.message === "gateway and rawData are required" || error.message === "Payment not found") {
      const statusCode = error.message === "gateway and rawData are required" ? 400 : 404;
      return sendError(res, error.message, statusCode);
    }
    logError(error, "Creating payment webhook");
    return sendError(res, "Error creating payment webhook", 500, error);
  }
}

export async function updatePaymentWebhook(req, res) {
  try {
    const { id } = req.params;
    const webhook = await paymentWebhookService.updatePaymentWebhook(
      id,
      req.body
    );
    return sendSuccess(res, webhook, "Payment webhook updated successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Payment webhook not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Updating payment webhook");
    return sendError(res, "Error updating payment webhook", 500, error);
  }
}

export async function deletePaymentWebhook(req, res) {
  try {
    const { id } = req.params;
    await paymentWebhookService.deletePaymentWebhook(id);
    return sendSuccess(res, null, "Payment webhook deleted successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Payment webhook not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Deleting payment webhook");
    return sendError(res, "Error deleting payment webhook", 500, error);
  }
}
