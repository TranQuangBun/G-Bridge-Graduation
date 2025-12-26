import { PaymentService } from "../services/PaymentService.js";
import { SubscriptionPlanService } from "../services/SubscriptionPlanService.js";
import { UserSubscriptionService } from "../services/UserSubscriptionService.js";
import { PaymentWebhookService } from "../services/PaymentWebhookService.js";
import { logError, AppError } from "../utils/Errors.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/Response.js";
import { vnpayConfig, vnpayHelpers, paypalConfig, momoConfig, momoHelpers, convertCurrency } from "../config/Payment.js";
import { PaymentGateway, PaymentStatus } from "../entities/PaymentConstants.js";
import { NotificationService } from "../services/NotificationService.js";
import { NotificationType } from "../entities/Notification.js";
import querystring from "node:querystring";

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
    
    // Convert amount from USD to VND for VNPay
    const amountUSD = parseFloat(plan.price);
    const amountVND = convertCurrency(amountUSD, plan.currency || "USD", "VND");
    const currency = "VND";

    // VNPay requires minimum amount of 1000 VND (approximately $0.04)
    // Free plans (amount = 0) cannot be paid via VNPay
    if (amountVND <= 0) {
      return sendError(
        res,
        "Free plans cannot be paid via payment gateway. Please contact support to activate free plan.",
        400
      );
    }

    if (amountVND < 1000) {
      return sendError(
        res,
        "Minimum payment amount is 1,000 VND. Please select a paid plan.",
        400
      );
    }

    // Create payment record (store in VND)
    const payment = await paymentService.createPayment({
      userId,
      planId,
      amount: amountVND,
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
    // VNPay vnp_OrderInfo: remove spaces or use underscore to avoid hash issues
    // Some VNPay versions are sensitive to spaces in OrderInfo
    vnp_Params["vnp_OrderInfo"] = `Payment_for_${plan.name}`.replace(/\s+/g, "_");
    vnp_Params["vnp_OrderType"] = "other";
    // VNPay amount is in smallest currency unit (đồng), so multiply by 100
    // amountVND is already in VND, so multiply by 100 to get đồng
    vnp_Params["vnp_Amount"] = Math.round(amountVND * 100);
    vnp_Params["vnp_ReturnUrl"] = vnpayConfig.vnp_ReturnUrl;
    // Note: vnp_IpnUrl is optional and may not be required for sandbox
    // VNPay cannot access localhost URLs, so we skip it for development
    // Uncomment if you have a public URL for IPN callback
    // vnp_Params["vnp_IpnUrl"] = vnpayConfig.vnp_IpnUrl;
    
    // Get IP address - VNPay requires real client IP
    // In Docker, req.ip might be Docker network IP, so try to get real client IP from headers
    let clientIp = 
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.headers["x-real-ip"] ||
      req.ip || 
      req.connection.remoteAddress || 
      "127.0.0.1";
    
    // Remove IPv6 prefix if present (::ffff:)
    if (clientIp && clientIp.startsWith("::ffff:")) {
      clientIp = clientIp.replace("::ffff:", "");
    }
    // If still IPv6 or Docker network IP, use 127.0.0.1 for localhost development
    if (clientIp && (clientIp.includes(":") || clientIp.startsWith("172.") || clientIp.startsWith("192.168."))) {
      // For Docker/localhost, use 127.0.0.1
      // In production, this should be the real client IP
      clientIp = "127.0.0.1";
    }
    vnp_Params["vnp_IpAddr"] = clientIp;
    
    vnp_Params["vnp_CreateDate"] = vnpayHelpers.formatDateTime();

    // Sort params alphabetically (VNPay requirement)
    vnp_Params = vnpayHelpers.sortObject(vnp_Params);

    // Debug: Log params before creating hash
    console.log("=== VNPay Payment Request ===");
    console.log("VNPay Config - TMN Code:", vnpayConfig.vnp_TmnCode);
    console.log("VNPay Config - Hash Secret:", vnpayConfig.vnp_HashSecret ? "***SET***" : "NOT SET");
    console.log("VNPay Config - Return URL:", vnpayConfig.vnp_ReturnUrl);
    console.log("Order ID:", orderId);
    console.log("Amount USD:", amountUSD);
    console.log("Amount VND:", amountVND);
    console.log("Client IP:", clientIp);
    console.log("VNPay Params (sorted, before hash):", JSON.stringify(vnp_Params, null, 2));

    // Create secure hash from sorted params (BEFORE adding vnp_SecureHash)
    const secureHash = vnpayHelpers.createSecureHash(
      vnp_Params,
      vnpayConfig.vnp_HashSecret
    );

    // Add hash to params AFTER creating hash
    vnp_Params["vnp_SecureHash"] = secureHash;

    // Build query string using querystring.stringify (VNPay official method)
    // Sort params again before building final URL (VNPay requirement)
    vnp_Params = vnpayHelpers.sortObject(vnp_Params);
    const queryString = querystring.stringify(vnp_Params);

    // Build final payment URL
    const paymentUrl = vnpayConfig.vnp_Url + "?" + queryString;

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

export async function createMoMoPayment(req, res) {
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

    // Convert amount from USD to VND for MoMo
    const amountUSD = parseFloat(plan.price);
    const amountVND = convertCurrency(amountUSD, plan.currency || "USD", "VND");
    const currency = "VND";

    // MoMo requires minimum amount of 1000 VND (approximately $0.04)
    // Free plans (amount = 0) cannot be paid via MoMo
    if (amountVND <= 0) {
      return sendError(
        res,
        "Free plans cannot be paid via payment gateway. Please contact support to activate free plan.",
        400
      );
    }

    if (amountVND < 1000) {
      return sendError(
        res,
        "Minimum payment amount is 1,000 VND. Please select a paid plan.",
        400
      );
    }

    // Create payment record first to get payment ID
    // Use temporary orderId, will update after creating MoMo order
    const tempOrderId = `MOMO_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const payment = await paymentService.createPayment({
      userId,
      planId,
      amount: amountVND,
      currency,
      paymentGateway: PaymentGateway.MOMO,
      orderId: tempOrderId,
      description: `Payment for ${plan.name}`,
    });

    // Create orderId in Laravel format: order_id_timestamp
    // Format: $order->order_id . "_" . time() (PHP format)
    const orderId = `${payment.id}_${Math.floor(Date.now() / 1000)}`;
    const requestId = orderId; // Use same as orderId for MoMo

    // Update payment with final orderId
    await paymentService.updatePayment(payment.id, { orderId });

    // Build MoMo payment request
    // Format: "SUDESPHONE #" . $order->order_id (PHP format)
    // Use payment.id (not orderId) for orderInfo to match PHP
    const orderInfo = `G-Bridge #${payment.id}`;
    const extraData = ""; // Can be used for additional data

    // Always use payWithATM for ATM/Credit card payment (as per PHP setup)
    const requestType = "payWithATM";

    const requestData = {
      partnerCode: momoConfig.partnerCode,
      partnerRefId: orderId,
      amount: momoHelpers.formatAmount(amountVND),
      orderInfo,
      returnUrl: momoConfig.returnUrl,
      notifyUrl: momoConfig.notifyUrl,
      extraData,
      requestType,
    };

    // Create signature
    const signature = momoHelpers.createSignature(requestData);

    // Build request body for MoMo API
    // MoMo API v2 requires "signature" field, not "hash"
    const requestBody = {
      partnerCode: momoConfig.partnerCode,
      partnerRefId: orderId,
      customerNumber: userId.toString(),
      appData: "",
      signature: signature, // MoMo API v2 uses "signature" field
      description: orderInfo,
      extraData,
      amount: momoHelpers.formatAmount(amountVND),
      orderId,
      orderInfo,
      requestId,
      requestType: requestData.requestType, // Use payWithATM for credit/debit card payment
      redirectUrl: momoConfig.returnUrl,
      ipnUrl: momoConfig.notifyUrl,
    };

    console.log("=== MoMo Payment Request ===");
    console.log("MoMo Config - Partner Code:", momoConfig.partnerCode);
    console.log("MoMo Config - Access Key:", momoConfig.accessKey ? "***SET***" : "NOT SET");
    console.log("MoMo Config - Secret Key:", momoConfig.secretKey ? "***SET***" : "NOT SET");
    console.log("MoMo Config - API URL:", momoConfig.apiUrl);
    console.log("MoMo Config - Return URL:", momoConfig.returnUrl);
    console.log("MoMo Config - Notify URL:", momoConfig.notifyUrl);
    console.log("Order ID:", orderId);
    console.log("Request ID:", requestId);
    console.log("Amount USD:", amountUSD);
    console.log("Amount VND:", amountVND);
    console.log("Request Type:", requestType);
    console.log("Order Info:", orderInfo);
    console.log("Request Body:", JSON.stringify(requestBody, null, 2));

    // Make API call to MoMo
    try {
      const response = await fetch(momoConfig.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();

      if (responseData.resultCode === 0 && responseData.payUrl) {
        // Update payment with request ID
        await paymentService.updatePayment(payment.id, {
          momoRequestId: requestId,
          momoOrderInfo: orderInfo,
        });

        return sendSuccess(
          res,
          { paymentUrl: responseData.payUrl, paymentId: payment.id, orderId, requestId },
          "MoMo payment URL created successfully",
          201
        );
      } else {
        // Payment creation failed
        const errorMessage = responseData.message || "Payment creation failed";
        const resultCode = responseData.resultCode?.toString() || "ERROR";
        
        console.error("MoMo Payment Failed:", {
          resultCode,
          message: errorMessage,
          fullResponse: responseData,
        });

        await paymentService.updatePayment(payment.id, {
          status: PaymentStatus.FAILED,
          momoMessage: errorMessage,
          momoResultCode: resultCode,
        });

        // Provide more helpful error message based on result code
        let userMessage = errorMessage;
        const resultCodeNum = parseInt(resultCode);
        
        // MoMo error codes reference
        // 1001: Invalid signature
        // 1002: Transaction rejected by issuers
        // 1003: Invalid request
        // 1004: Amount invalid
        // 1005: Order already exists
        // 1006: Order not found
        // 1007: Transaction failed
        
        if (resultCodeNum === 1001) {
          userMessage = "Lỗi xác thực. Vui lòng kiểm tra lại cấu hình MoMo credentials.";
        } else if (resultCodeNum === 1002 || errorMessage.includes("rejected") || errorMessage.includes("issuers")) {
          userMessage = "Giao dịch bị từ chối bởi ngân hàng phát hành thẻ. Nguyên nhân có thể: thông tin thẻ không đúng, thẻ bị khóa, hoặc không đủ số dư. Vui lòng kiểm tra lại thông tin thẻ hoặc thử thẻ khác.";
        } else if (resultCodeNum === 1003) {
          userMessage = "Yêu cầu không hợp lệ. Vui lòng thử lại sau.";
        } else if (resultCodeNum === 1004) {
          userMessage = "Số tiền không hợp lệ. Vui lòng chọn gói khác.";
        } else if (resultCodeNum === 1005) {
          userMessage = "Đơn hàng đã tồn tại. Vui lòng thử lại sau.";
        } else if (resultCodeNum === 1006) {
          userMessage = "Không tìm thấy đơn hàng. Vui lòng thử lại.";
        }

        return sendError(
          res,
          userMessage,
          400
        );
      }
    } catch (apiError) {
      logError(apiError, "Calling MoMo API");
      await paymentService.updatePayment(payment.id, {
        status: PaymentStatus.FAILED,
        momoMessage: "API call failed",
      });
      return sendError(res, "Error calling MoMo API", 500, apiError);
    }
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    logError(error, "Creating MoMo payment");
    return sendError(res, "Error creating MoMo payment", 500, error);
  }
}

export async function verifyMoMoPayment(req, res) {
  try {
    const queryParams = req.query;
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = queryParams;

    if (!orderId) {
      return sendError(res, "Missing order ID", 400);
    }

    if (!signature) {
      return sendError(res, "Missing signature", 400);
    }

    // Verify signature
    const callbackData = {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData: extraData || "",
    };

    const isValidSignature = momoHelpers.verifySignature(callbackData, signature);

    if (!isValidSignature) {
      return sendError(res, "Invalid signature", 400);
    }

    // Find payment by orderId
    const payment = await paymentService.getPaymentByOrderId(orderId);
    if (!payment) {
      return sendError(res, "Payment not found", 404);
    }

    // Check if already processed
    if (payment.status === PaymentStatus.COMPLETED) {
      return sendSuccess(
        res,
        { payment, message: "Payment already processed" },
        "Payment already verified"
      );
    }

    // Update payment based on result code
    // MoMo resultCode: 0 = success, others = failure
    const isSuccess = resultCode === "0" || resultCode === 0;

    const updateData = {
      status: isSuccess ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
      momoTransId: transId || null,
      momoRequestId: requestId || null,
      momoOrderInfo: orderInfo || null,
      momoPayType: payType || null,
      momoResultCode: resultCode?.toString() || null,
      momoMessage: message || null,
      paidAt: isSuccess ? new Date() : null,
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
        logError(subError, "Creating subscription after MoMo payment");
        // Don't fail the payment verification if subscription creation fails
      }
    }

    return sendSuccess(
      res,
      { payment: updatedPayment, redirect: isSuccess ? "/pricing?success=true" : "/pricing?error=true" },
      isSuccess ? "MoMo payment verified successfully" : "MoMo payment failed"
    );
  } catch (error) {
    if (error instanceof AppError || error.message === "Payment not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Verifying MoMo payment");
    return sendError(res, "Error verifying MoMo payment", 500, error);
  }
}

export async function handleMoMoWebhook(req, res) {
  try {
    const webhookData = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = webhookData;

    // Create webhook record
    await paymentWebhookService.createPaymentWebhook(
      {
        gateway: "momo",
        eventType: resultCode === "0" ? "payment.success" : "payment.failed",
        orderId: orderId || null,
        transactionId: transId || null,
        status: resultCode === "0" ? "success" : "failed",
        rawData: webhookData,
      },
      ipAddress
    );

    // Verify signature
    const callbackData = {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData: extraData || "",
    };

    const isValidSignature = momoHelpers.verifySignature(callbackData, signature);

    if (!isValidSignature) {
      logError(new Error("Invalid MoMo webhook signature"), "MoMo webhook verification");
      return sendError(res, "Invalid signature", 400);
    }

    // Process webhook (update payment status, etc.)
    if (orderId) {
      try {
        const payment = await paymentService.getPaymentByOrderId(orderId);
        if (payment) {
          const isSuccess = resultCode === "0" || resultCode === 0;
          await paymentService.updatePayment(payment.id, {
            status: isSuccess ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
            momoTransId: transId || null,
            momoRequestId: requestId || null,
            momoOrderInfo: orderInfo || null,
            momoPayType: payType || null,
            momoResultCode: resultCode?.toString() || null,
            momoMessage: message || null,
            paidAt: isSuccess ? new Date() : null,
          });

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
              logError(subError, "Creating subscription after MoMo webhook");
            }
          }
        }
      } catch (paymentError) {
        logError(paymentError, "Processing MoMo webhook payment update");
      }
    }

    return sendSuccess(res, { received: true }, "Webhook received", 200);
  } catch (error) {
    logError(error, "Handling MoMo webhook");
    return sendError(res, "Error handling webhook", 500, error);
  }
}
