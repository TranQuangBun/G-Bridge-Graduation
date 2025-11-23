import { PaymentService } from "../services/PaymentService.js";
import { SubscriptionPlanService } from "../services/SubscriptionPlanService.js";
import { UserSubscriptionService } from "../services/UserSubscriptionService.js";
import { PaymentWebhookService } from "../services/PaymentWebhookService.js";
import { logError, AppError } from "../utils/Errors.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/Response.js";
import { vnpayConfig, vnpayHelpers, paypalConfig } from "../config/Payment.js";
import { PaymentGateway, PaymentStatus } from "../entities/PaymentConstants.js";
import { NotificationService } from "../services/NotificationService.js";
import { NotificationType } from "../entities/Notification.js";

const paymentService = new PaymentService();
const subscriptionPlanService = new SubscriptionPlanService();
const userSubscriptionService = new UserSubscriptionService();
const paymentWebhookService = new PaymentWebhookService();
const notificationService = new NotificationService();

export async function getAllPayments(req, res) {
  try {
    const data = await paymentService.getAllPayments(req.query);
    if (data.pagination) {
      return sendPaginated(
        res,
        data.payments || data,
        data.pagination,
        "Payments fetched successfully"
      );
    }
    return sendSuccess(res, data, "Payments fetched successfully");
  } catch (error) {
    logError(error, "Fetching payments");
    return sendError(res, "Error fetching payments", 500, error);
  }
}

export async function getPaymentById(req, res) {
  try {
    const { id } = req.params;
    const paymentId = parseInt(id);
    if (isNaN(paymentId)) {
      return sendError(res, "Invalid payment ID", 400);
    }
    const payment = await paymentService.getPaymentById(paymentId);
    return sendSuccess(res, payment, "Payment fetched successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Payment not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Fetching payment");
    return sendError(res, "Error fetching payment", 500, error);
  }
}

export async function createPayment(req, res) {
  try {
    const payment = await paymentService.createPayment(req.body);
    return sendSuccess(res, payment, "Payment created successfully", 201);
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    if (
      error.message ===
        "userId, amount, paymentGateway, and orderId are required" ||
      error.message === "User not found" ||
      error.message === "Subscription plan not found"
    ) {
      const statusCode =
        error.message ===
        "userId, amount, paymentGateway, and orderId are required"
          ? 400
          : 404;
      return sendError(res, error.message, statusCode);
    }
    logError(error, "Creating payment");
    return sendError(res, "Error creating payment", 500, error);
  }
}

export async function updatePayment(req, res) {
  try {
    const { id } = req.params;
    const payment = await paymentService.updatePayment(id, req.body);
    return sendSuccess(res, payment, "Payment updated successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Payment not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Updating payment");
    return sendError(res, "Error updating payment", 500, error);
  }
}

export async function getSubscriptionPlans(req, res) {
  try {
    const data = await subscriptionPlanService.getActivePlans();
    return sendSuccess(res, data, "Subscription plans fetched successfully");
  } catch (error) {
    logError(error, "Fetching subscription plans");
    return sendError(res, "Error fetching subscription plans", 500, error);
  }
}

export async function createVNPayPayment(req, res) {
  try {
    const { planId } = req.body;
    const userId = req.user.sub; // JWT payload uses 'sub' for user ID

    if (!planId) {
      return sendError(res, "planId is required", 400);
    }

    const plan = await subscriptionPlanService.getSubscriptionPlanById(planId);
    if (!plan) {
      return sendError(res, "Subscription plan not found", 404);
    }

    const orderId = vnpayHelpers.createOrderId("VNPAY");
    const amount = parseFloat(plan.price);
    const currency = "VND";

    // Create payment record
    const payment = await paymentService.createPayment({
      userId,
      planId,
      amount,
      currency,
      paymentGateway: PaymentGateway.VNPAY,
      orderId,
      description: `Payment for ${plan.name}`,
    });

    // Build VNPay payment URL according to official demo
    let vnp_Params = {};
    vnp_Params["vnp_Version"] = "2.1.0";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = vnpayConfig.vnp_TmnCode;
    vnp_Params["vnp_Locale"] = "vn";
    vnp_Params["vnp_CurrCode"] = "VND";
    vnp_Params["vnp_TxnRef"] = orderId;
    vnp_Params["vnp_OrderInfo"] = `Payment for ${plan.name}`;
    vnp_Params["vnp_OrderType"] = "other";
    vnp_Params["vnp_Amount"] = Math.round(amount * 100);
    vnp_Params["vnp_ReturnUrl"] = vnpayConfig.vnp_ReturnUrl;
    vnp_Params["vnp_IpAddr"] =
      req.ip || req.connection.remoteAddress || "127.0.0.1";
    vnp_Params["vnp_CreateDate"] = vnpayHelpers.formatDateTime();

    // Sort params first
    vnp_Params = vnpayHelpers.sortObject(vnp_Params);

    // Create secure hash from RAW params (not URL-encoded)
    const secureHash = vnpayHelpers.createSecureHash(
      vnp_Params,
      vnpayConfig.vnp_HashSecret
    );

    // Add hash to params
    vnp_Params["vnp_SecureHash"] = secureHash;

    // Build query string (this will URL-encode the values)
    const queryString = new URLSearchParams(vnp_Params).toString();

    // Build final payment URL
    const paymentUrl = vnpayConfig.vnp_Url + "?" + queryString;

    // Debug log
    console.log("=== VNPay Payment Request ===");
    console.log("Order ID:", orderId);
    console.log("Amount:", amount);
    console.log("Payment URL:", paymentUrl);

    return sendSuccess(
      res,
      { paymentUrl, paymentId: payment.id, orderId },
      "VNPay payment URL created successfully",
      201
    );
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    logError(error, "Creating VNPay payment");
    return sendError(res, "Error creating VNPay payment", 500, error);
  }
}

export async function verifyVNPayPayment(req, res) {
  try {
    const queryParams = req.query;
    const {
      vnp_TxnRef,
      vnp_TransactionNo,
      vnp_ResponseCode,
      vnp_SecureHash,
      vnp_BankCode,
      vnp_CardType,
    } = queryParams;

    if (!vnp_TxnRef) {
      return sendError(res, "Missing transaction reference", 400);
    }

    // Verify secure hash
    const isValidHash = vnpayHelpers.verifySecureHash(
      queryParams,
      vnp_SecureHash,
      vnpayConfig.vnp_HashSecret
    );

    if (!isValidHash) {
      return sendError(res, "Invalid secure hash", 400);
    }

    // Find payment by orderId
    const payment = await paymentService.getPaymentByOrderId(vnp_TxnRef);
    if (!payment) {
      return sendError(res, "Payment not found", 404);
    }

    // Check response code (00 = success)
    const isSuccess = vnp_ResponseCode === "00";

    // Update payment status
    const updateData = {
      status: isSuccess ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
      vnpayTransactionNo: vnp_TransactionNo || null,
      vnpayBankCode: vnp_BankCode || null,
      vnpayCardType: vnp_CardType || null,
      vnpaySecureHash: vnp_SecureHash || null,
    };

    const updatedPayment = await paymentService.updatePayment(
      payment.id,
      updateData
    );

    // If payment successful, create subscription
    if (isSuccess && payment.planId) {
      try {
        const plan = await subscriptionPlanService.getSubscriptionPlanById(
          payment.planId
        );
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + plan.duration);

        await userSubscriptionService.createUserSubscription({
          userId: payment.userId,
          planId: payment.planId,
          paymentId: payment.id,
          startDate,
          endDate,
          autoRenew: false,
        });

        await notificationService.createNotification({
          recipientId: payment.userId,
          actorId: null,
          type: NotificationType.PAYMENT_SUCCESS,
          title: `Payment successful for ${plan.name}`,
          message: `Your ${
            plan.name
          } plan is now active until ${endDate.toLocaleDateString()}`,
          metadata: {
            paymentId: payment.id,
            planId: plan.id,
            endDate,
          },
        });
      } catch (subError) {
        logError(subError, "Creating subscription after payment");
        // Don't fail the payment verification if subscription creation fails
      }
    }

    return sendSuccess(
      res,
      {
        payment: updatedPayment,
        success: isSuccess,
        message: isSuccess
          ? "Payment verified successfully"
          : "Payment verification failed",
      },
      isSuccess
        ? "Payment verified successfully"
        : "Payment verification failed"
    );
  } catch (error) {
    if (error instanceof AppError || error.message === "Payment not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Verifying VNPay payment");
    return sendError(res, "Error verifying VNPay payment", 500, error);
  }
}

export async function createPayPalPayment(req, res) {
  try {
    const { planId } = req.body;
    const userId = req.user.sub; // JWT payload uses 'sub' for user ID

    if (!planId) {
      return sendError(res, "planId is required", 400);
    }

    const plan = await subscriptionPlanService.getSubscriptionPlanById(planId);
    if (!plan) {
      return sendError(res, "Subscription plan not found", 404);
    }

    const orderId = `PAYPAL_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const amount = parseFloat(plan.price);
    const currency = "USD";

    // Create payment record
    const payment = await paymentService.createPayment({
      userId,
      planId,
      amount,
      currency,
      paymentGateway: PaymentGateway.PAYPAL,
      orderId,
      description: `Payment for ${plan.name}`,
    });

    // Note: In a real implementation, you would create a PayPal order here
    // using the PayPal SDK. For now, we'll return the payment info.
    // The frontend should handle creating the PayPal order.

    return sendSuccess(
      res,
      {
        paymentId: payment.id,
        orderId,
        amount,
        currency,
        planName: plan.name,
        // PayPal order creation should be done on frontend or via PayPal SDK
      },
      "PayPal payment created successfully",
      201
    );
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    logError(error, "Creating PayPal payment");
    return sendError(res, "Error creating PayPal payment", 500, error);
  }
}

export async function verifyPayPalPayment(req, res) {
  try {
    const { orderId } = req.body;
    const userId = req.user.sub; // JWT payload uses 'sub' for user ID

    if (!orderId) {
      return sendError(res, "orderId is required", 400);
    }

    // Find payment by orderId
    const payment = await paymentService.getPaymentByOrderId(orderId);
    if (!payment) {
      return sendError(res, "Payment not found", 404);
    }

    // Verify payment belongs to user
    if (payment.userId !== userId) {
      return sendError(res, "Unauthorized", 403);
    }

    // Note: In a real implementation, you would verify the PayPal order
    // using the PayPal SDK. For now, we'll update the payment status.

    // Update payment status
    const updateData = {
      status: PaymentStatus.COMPLETED,
      paypalOrderId: orderId,
    };

    const updatedPayment = await paymentService.updatePayment(
      payment.id,
      updateData
    );

    // If payment successful, create subscription
    if (payment.planId) {
      try {
        const plan = await subscriptionPlanService.getSubscriptionPlanById(
          payment.planId
        );
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + plan.duration);

        await userSubscriptionService.createUserSubscription({
          userId: payment.userId,
          planId: payment.planId,
          paymentId: payment.id,
          startDate,
          endDate,
          autoRenew: false,
        });

        await notificationService.createNotification({
          recipientId: payment.userId,
          actorId: null,
          type: NotificationType.PAYMENT_SUCCESS,
          title: `Payment successful for ${plan.name}`,
          message: `Your ${
            plan.name
          } plan is now active until ${endDate.toLocaleDateString()}`,
          metadata: {
            paymentId: payment.id,
            planId: plan.id,
            endDate,
          },
        });
      } catch (subError) {
        logError(subError, "Creating subscription after payment");
        // Don't fail the payment verification if subscription creation fails
      }
    }

    return sendSuccess(
      res,
      { payment: updatedPayment },
      "PayPal payment verified successfully"
    );
  } catch (error) {
    if (error instanceof AppError || error.message === "Payment not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Verifying PayPal payment");
    return sendError(res, "Error verifying PayPal payment", 500, error);
  }
}

export async function getPaymentHistory(req, res) {
  try {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      return sendError(res, "User ID not found", 401);
    }
    const data = await paymentService.getAllPayments({
      ...req.query,
      userId: userId.toString(),
    });
    if (data.pagination) {
      return sendPaginated(
        res,
        data.payments || data,
        data.pagination,
        "Payment history fetched successfully"
      );
    }
    return sendSuccess(res, data, "Payment history fetched successfully");
  } catch (error) {
    logError(error, "Fetching payment history");
    return sendError(res, "Error fetching payment history", 500, error);
  }
}

export async function getSubscriptionStatus(req, res) {
  try {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      return sendError(res, "User ID not found", 401);
    }
    const subscription =
      await userSubscriptionService.getUserSubscriptionByUserId(userId);
    return sendSuccess(
      res,
      subscription,
      "Subscription status fetched successfully"
    );
  } catch (error) {
    if (error.message === "User subscription not found") {
      return sendSuccess(res, null, "No active subscription found");
    }
    logError(error, "Fetching subscription status");
    return sendError(res, "Error fetching subscription status", 500, error);
  }
}

export async function cancelSubscription(req, res) {
  try {
    const userId = req.user.sub; // JWT payload uses 'sub' for user ID
    const { reason } = req.body;

    // Get user's subscription
    const subscription =
      await userSubscriptionService.getUserSubscriptionByUserId(userId);

    // Cancel subscription
    const cancelledSubscription =
      await userSubscriptionService.cancelUserSubscription(
        subscription.id,
        reason
      );

    return sendSuccess(
      res,
      cancelledSubscription,
      "Subscription cancelled successfully"
    );
  } catch (error) {
    if (
      error instanceof AppError ||
      error.message === "User subscription not found"
    ) {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Cancelling subscription");
    return sendError(res, "Error cancelling subscription", 500, error);
  }
}

export async function handleVNPayWebhook(req, res) {
  try {
    const webhookData = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Create webhook record
    await paymentWebhookService.createPaymentWebhook(
      {
        gateway: "vnpay",
        eventType: webhookData.vnp_TransactionStatus || "unknown",
        orderId: webhookData.vnp_TxnRef || null,
        transactionId: webhookData.vnp_TransactionNo || null,
        status: webhookData.vnp_ResponseCode || null,
        rawData: webhookData,
      },
      ipAddress
    );

    // Process webhook (update payment status, etc.)
    if (webhookData.vnp_TxnRef) {
      try {
        const payment = await paymentService.getPaymentByOrderId(
          webhookData.vnp_TxnRef
        );
        if (payment) {
          const isSuccess = webhookData.vnp_ResponseCode === "00";
          await paymentService.updatePayment(payment.id, {
            status: isSuccess ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
            vnpayTransactionNo: webhookData.vnp_TransactionNo || null,
            vnpayBankCode: webhookData.vnp_BankCode || null,
            vnpayCardType: webhookData.vnp_CardType || null,
          });
        }
      } catch (paymentError) {
        logError(paymentError, "Processing VNPay webhook payment update");
      }
    }

    return sendSuccess(res, { received: true }, "Webhook received", 200);
  } catch (error) {
    logError(error, "Handling VNPay webhook");
    return sendError(res, "Error handling webhook", 500, error);
  }
}

export async function handlePayPalWebhook(req, res) {
  try {
    const webhookData = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Create webhook record
    await paymentWebhookService.createPaymentWebhook(
      {
        gateway: "paypal",
        eventType: webhookData.event_type || "unknown",
        orderId: webhookData.resource?.id || null,
        transactionId: webhookData.resource?.id || null,
        status: webhookData.resource?.status || null,
        rawData: webhookData,
      },
      ipAddress
    );

    // Process webhook (update payment status, etc.)
    // Note: In a real implementation, you would verify the webhook signature
    // and process different event types (payment.completed, payment.captured, etc.)

    return sendSuccess(res, { received: true }, "Webhook received", 200);
  } catch (error) {
    logError(error, "Handling PayPal webhook");
    return sendError(res, "Error handling webhook", 500, error);
  }
}
