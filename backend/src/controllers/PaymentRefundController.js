import { PaymentRefundService } from "../services/PaymentRefundService.js";
import { logError, AppError } from "../utils/Errors.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/Response.js";

const paymentRefundService = new PaymentRefundService();

export async function getAllPaymentRefunds(req, res) {
  try {
    const data = await paymentRefundService.getAllPaymentRefunds(req.query);
    if (data.pagination) {
      return sendPaginated(res, data.refunds || data, data.pagination, "Payment refunds fetched successfully");
    }
    return sendSuccess(res, data, "Payment refunds fetched successfully");
  } catch (error) {
    logError(error, "Fetching payment refunds");
    return sendError(res, "Error fetching payment refunds", 500, error);
  }
}

export async function getPaymentRefundById(req, res) {
  try {
    const { id } = req.params;
    const refund = await paymentRefundService.getPaymentRefundById(id);
    return sendSuccess(res, refund, "Payment refund fetched successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Payment refund not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Fetching payment refund");
    return sendError(res, "Error fetching payment refund", 500, error);
  }
}

export async function createPaymentRefund(req, res) {
  try {
    const refund = await paymentRefundService.createPaymentRefund(req.body);
    return sendSuccess(res, refund, "Payment refund requested successfully", 201);
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    if (
      error.message === "paymentId, userId, and amount are required" ||
      error.message === "Payment not found" ||
      error.message === "User not found" ||
      error.message === "Refund amount cannot exceed payment amount"
    ) {
      const statusCode = error.message === "paymentId, userId, and amount are required" ||
                        error.message === "Refund amount cannot exceed payment amount" ? 400 : 404;
      return sendError(res, error.message, statusCode);
    }
    logError(error, "Creating payment refund");
    return sendError(res, "Error creating payment refund", 500, error);
  }
}

export async function updatePaymentRefund(req, res) {
  try {
    const { id } = req.params;
    const refund = await paymentRefundService.updatePaymentRefund(
      id,
      req.body
    );
    return sendSuccess(res, refund, "Payment refund updated successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Payment refund not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Updating payment refund");
    return sendError(res, "Error updating payment refund", 500, error);
  }
}

export async function approvePaymentRefund(req, res) {
  try {
    const { id } = req.params;
    const { processedBy, refundTransactionId, notes } = req.body;
    const refund = await paymentRefundService.approvePaymentRefund(
      id,
      processedBy,
      refundTransactionId,
      notes
    );
    return sendSuccess(res, refund, "Payment refund approved successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    if (
      error.message === "Payment refund not found" ||
      error.message === "Only pending refunds can be approved"
    ) {
      const statusCode = error.message === "Payment refund not found" ? 404 : 400;
      return sendError(res, error.message, statusCode);
    }
    logError(error, "Approving payment refund");
    return sendError(res, "Error approving payment refund", 500, error);
  }
}

export async function rejectPaymentRefund(req, res) {
  try {
    const { id } = req.params;
    const { processedBy, notes } = req.body;
    const refund = await paymentRefundService.rejectPaymentRefund(
      id,
      processedBy,
      notes
    );
    return sendSuccess(res, refund, "Payment refund rejected successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    if (
      error.message === "Payment refund not found" ||
      error.message === "Only pending refunds can be rejected"
    ) {
      const statusCode = error.message === "Payment refund not found" ? 404 : 400;
      return sendError(res, error.message, statusCode);
    }
    logError(error, "Rejecting payment refund");
    return sendError(res, "Error rejecting payment refund", 500, error);
  }
}
