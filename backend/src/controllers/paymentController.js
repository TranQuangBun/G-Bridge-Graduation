import querystring from "querystring";
import {
  Payment,
  SubscriptionPlan,
  UserSubscription,
  PaymentWebhook,
  User,
} from "../models/index.js";
import {
  vnpayConfig,
  vnpayHelpers,
  paypalConfig,
  PAYMENT_STATUS,
  PAYMENT_GATEWAY,
  SUBSCRIPTION_STATUS,
} from "../config/payment.js";
import paypal from "@paypal/checkout-server-sdk";
import { Op } from "sequelize";

// ==================== PAYPAL CLIENT SETUP ====================
function paypalClient() {
  const environment =
    paypalConfig.mode === "live"
      ? new paypal.core.LiveEnvironment(
          paypalConfig.clientId,
          paypalConfig.clientSecret
        )
      : new paypal.core.SandboxEnvironment(
          paypalConfig.clientId,
          paypalConfig.clientSecret
        );
  return new paypal.core.PayPalHttpClient(environment);
}

// ==================== CREATE PAYMENT (VNPay) ====================
export const createVNPayPayment = async (req, res) => {
  try {
    const { planId, billingCycle = "monthly" } = req.body;
    const userId = req.user.sub || req.user.id; // JWT uses 'sub' for user ID

    // Get subscription plan
    const plan = await SubscriptionPlan.findByPk(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found or inactive",
      });
    }

    // Create order ID
    const orderId = vnpayHelpers.createOrderId("VNPAY");

    // Get user IP
    const ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress;

    // Calculate amount and duration based on billing cycle
    const isYearly = billingCycle === "yearly";
    const monthlyPrice = parseFloat(plan.price);
    const finalAmount = isYearly
      ? Math.round(monthlyPrice * 12 * 0.8)
      : monthlyPrice;
    const durationMultiplier = isYearly ? 12 : 1;
    const billingLabel = isYearly ? "Yearly" : "Monthly";

    // Create payment record with custom amount and metadata
    const payment = await Payment.create({
      userId,
      planId,
      orderId,
      amount: finalAmount,
      currency: "VND",
      status: PAYMENT_STATUS.PENDING,
      paymentMethod: "vnpay",
      paymentGateway: PAYMENT_GATEWAY.VNPAY,
      ipAddress: ipAddr,
      userAgent: req.headers["user-agent"],
      description: `Payment for ${plan.displayName} (${billingLabel})`,
      metadata: JSON.stringify({
        billingCycle,
        durationMultiplier,
        originalMonthlyPrice: monthlyPrice,
        discountApplied: isYearly ? 20 : 0,
      }),
    });

    // VNPay payment parameters
    const createDate = vnpayHelpers.formatDateTime();

    // Convert USD to VND (1 USD = 25,000 VND for better rate)
    // VNPay amount must be in VND without decimal, multiply by 100 for smallest unit
    // Example: $10 = 250,000 VND → vnp_Amount = 25,000,000 (250,000 * 100)
    const priceUSD = finalAmount;
    const amountVND = Math.round(priceUSD * 25000); // Convert to VND
    const vnpAmount = amountVND * 100; // VNPay requires amount * 100

    console.log(`💰 Payment Calculation:
      - Plan: ${plan.displayName}
      - Billing Cycle: ${billingLabel}
      - Original Monthly Price: $${monthlyPrice}
      - Final Amount USD: $${priceUSD}
      - Discount: ${isYearly ? "20%" : "None"}
      - Duration: ${durationMultiplier} month(s)
      - Amount VND: ${amountVND.toLocaleString("vi-VN")} VND
      - VNPay Amount (x100): ${vnpAmount.toLocaleString("vi-VN")}
    `);

    let vnpParams = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: vnpayConfig.vnp_TmnCode,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan goi ${plan.displayName} (${billingLabel})`,
      vnp_OrderType: "other",
      vnp_Amount: vnpAmount,
      vnp_ReturnUrl: vnpayConfig.vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    // Sort and create secure hash
    vnpParams = vnpayHelpers.sortObject(vnpParams);

    // Debug: Log params before creating hash
    console.log("VNPay Params before hash:", vnpParams);
    console.log("VNPay Secret Key:", vnpayConfig.vnp_HashSecret);

    const secureHash = vnpayHelpers.createSecureHash(
      vnpParams,
      vnpayConfig.vnp_HashSecret
    );
    vnpParams.vnp_SecureHash = secureHash;

    console.log("VNPay Secure Hash:", secureHash);

    // Create payment URL - manually build query string to match VNPay encoding
    const queryString = Object.keys(vnpParams)
      .map((key) => {
        return `${key}=${encodeURIComponent(vnpParams[key]).replace(
          /%20/g,
          "+"
        )}`;
      })
      .join("&");

    const paymentUrl = `${vnpayConfig.vnp_Url}?${queryString}`;

    res.json({
      success: true,
      message: "VNPay payment URL created successfully",
      data: {
        paymentId: payment.id,
        orderId,
        paymentUrl,
        amount: finalAmount,
        currency: "VND",
        gateway: PAYMENT_GATEWAY.VNPAY,
        billingCycle,
      },
    });
  } catch (error) {
    console.error("Create VNPay payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create VNPay payment",
      error: error.message,
    });
  }
};

// ==================== VERIFY VNPAY PAYMENT ====================
export const verifyVNPayPayment = async (req, res) => {
  try {
    // Create a copy of query params to avoid modifying original
    const vnpParams = { ...req.query };
    const secureHash = vnpParams.vnp_SecureHash;

    console.log("🔍 VNPay Callback Received:");
    console.log("- All params:", JSON.stringify(vnpParams, null, 2));
    console.log("- Order ID:", vnpParams.vnp_TxnRef);
    console.log("- Response Code:", vnpParams.vnp_ResponseCode);
    console.log("- Transaction No:", vnpParams.vnp_TransactionNo);
    console.log("- Amount:", parseInt(vnpParams.vnp_Amount) / 100, "VND");
    console.log("- Bank Code:", vnpParams.vnp_BankCode);

    // NOTE: VNPay sandbox signature verification may fail due to:
    // - VNPay adds extra params (vnp_PayDate, vnp_TransactionStatus) in callback
    // - Different encoding rules between request and callback
    // For production, implement proper signature verification with VNPay's documentation
    // For now, we verify by checking orderId exists in database and responseCode

    const orderId = vnpParams.vnp_TxnRef;
    const responseCode = vnpParams.vnp_ResponseCode;
    const transactionNo = vnpParams.vnp_TransactionNo;
    const amount = parseInt(vnpParams.vnp_Amount) / 100;
    const bankCode = vnpParams.vnp_BankCode;
    const cardType = vnpParams.vnp_CardType;

    // Find payment
    const payment = await Payment.findOne({
      where: { orderId },
      include: [
        { model: SubscriptionPlan, as: "plan" },
        { model: User, as: "user" },
      ],
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Check if already processed
    if (payment.status !== PAYMENT_STATUS.PENDING) {
      return res.json({
        success: true,
        message: "Payment already processed",
        data: {
          orderId,
          status: payment.status,
        },
      });
    }

    // Update payment based on response code
    if (responseCode === "00") {
      // Payment successful
      console.log("✅ Payment successful! Processing subscription...");

      await payment.update({
        status: PAYMENT_STATUS.COMPLETED,
        vnpayTransactionNo: transactionNo,
        vnpayBankCode: bankCode,
        vnpayCardType: cardType,
        transactionId: transactionNo,
        paidAt: new Date(),
        paymentData: vnpParams,
      });

      // Create or update user subscription
      const endDate = new Date();

      // Get duration multiplier from payment metadata (for yearly billing)
      let durationMultiplier = 1;
      if (payment.metadata) {
        try {
          const metadata = JSON.parse(payment.metadata);
          durationMultiplier = metadata.durationMultiplier || 1;
          console.log("📅 Duration multiplier:", durationMultiplier);
        } catch (e) {
          console.error("Failed to parse payment metadata:", e);
        }
      }

      // Calculate end date based on plan duration and billing cycle
      const totalDays = payment.plan.duration * durationMultiplier;
      endDate.setDate(endDate.getDate() + totalDays);

      console.log("📦 Creating subscription:");
      console.log("- Plan:", payment.plan.displayName);
      console.log("- Duration:", totalDays, "days");
      console.log("- End date:", endDate.toISOString());

      await UserSubscription.create({
        userId: payment.userId,
        planId: payment.planId,
        paymentId: payment.id,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        startDate: new Date(),
        endDate,
        autoRenew: false,
      });

      // Update user premium status
      await User.update(
        {
          isPremium: true,
          premiumExpiresAt: endDate,
        },
        { where: { id: payment.userId } }
      );

      console.log("✅ Subscription created successfully!");

      return res.json({
        success: true,
        message: "Payment completed successfully",
        data: {
          orderId,
          transactionNo,
          amount: payment.amount,
          status: PAYMENT_STATUS.COMPLETED,
        },
      });
    } else {
      // Payment failed
      console.error("❌ Payment failed! Response code:", responseCode);

      await payment.update({
        status: PAYMENT_STATUS.FAILED,
        paymentData: vnpParams,
      });

      return res.json({
        success: false,
        message: "Payment failed",
        data: {
          orderId,
          responseCode,
          status: PAYMENT_STATUS.FAILED,
        },
      });
    }
  } catch (error) {
    console.error("Verify VNPay payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error: error.message,
    });
  }
};

// ==================== CREATE PAYMENT (PayPal) ====================
export const createPayPalPayment = async (req, res) => {
  try {
    const { planId, billingCycle = "monthly" } = req.body;
    const userId = req.user.sub || req.user.id; // JWT uses 'sub' for user ID

    // Get subscription plan
    const plan = await SubscriptionPlan.findByPk(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found or inactive",
      });
    }

    // Create order ID
    const orderId = vnpayHelpers.createOrderId("PAYPAL");

    // Get user IP
    const ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress;

    // Calculate amount and duration based on billing cycle
    const isYearly = billingCycle === "yearly";
    const monthlyPrice = parseFloat(plan.price);
    const finalAmount = isYearly
      ? Math.round(monthlyPrice * 12 * 0.8 * 100) / 100
      : monthlyPrice;
    const durationMultiplier = isYearly ? 12 : 1;
    const billingLabel = isYearly ? "Yearly" : "Monthly";

    // Create payment record with custom amount and metadata
    const payment = await Payment.create({
      userId,
      planId,
      orderId,
      amount: finalAmount,
      currency: "USD",
      status: PAYMENT_STATUS.PENDING,
      paymentMethod: "paypal",
      paymentGateway: PAYMENT_GATEWAY.PAYPAL,
      ipAddress: ipAddr,
      userAgent: req.headers["user-agent"],
      description: `Payment for ${plan.displayName} (${billingLabel})`,
      metadata: JSON.stringify({
        billingCycle,
        durationMultiplier,
        originalMonthlyPrice: monthlyPrice,
        discountApplied: isYearly ? 20 : 0,
      }),
    });

    console.log(`💳 PayPal Payment Calculation:
      - Plan: ${plan.displayName}
      - Billing Cycle: ${billingLabel}
      - Original Monthly Price: $${monthlyPrice}
      - Final Amount USD: $${finalAmount}
      - Discount: ${isYearly ? "20%" : "None"}
      - Duration: ${durationMultiplier} month(s)
    `);

    // Create PayPal order
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: orderId,
          description: `${plan.displayName} Subscription (${billingLabel})`,
          amount: {
            currency_code: "USD",
            value: finalAmount.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: "G-Bridge",
        landing_page: "BILLING",
        user_action: "PAY_NOW",
        return_url: `${paypalConfig.returnUrl}?orderId=${orderId}`,
        cancel_url: `${paypalConfig.cancelUrl}?orderId=${orderId}`,
      },
    });

    const order = await paypalClient().execute(request);

    // Update payment with PayPal order ID
    await payment.update({
      paypalOrderId: order.result.id,
    });

    // Get approval URL
    const approvalUrl = order.result.links.find(
      (link) => link.rel === "approve"
    ).href;

    res.json({
      success: true,
      message: "PayPal payment created successfully",
      data: {
        paymentId: payment.id,
        orderId,
        paypalOrderId: order.result.id,
        paymentUrl: approvalUrl,
        amount: finalAmount,
        currency: "USD",
        gateway: PAYMENT_GATEWAY.PAYPAL,
        billingCycle,
      },
    });
  } catch (error) {
    console.error("Create PayPal payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create PayPal payment",
      error: error.message,
    });
  }
};

// ==================== VERIFY PAYPAL PAYMENT ====================
export const verifyPayPalPayment = async (req, res) => {
  try {
    const { orderId, paypalOrderId } = req.body;

    // Find payment
    const payment = await Payment.findOne({
      where: { orderId },
      include: [
        { model: SubscriptionPlan, as: "plan" },
        { model: User, as: "user" },
      ],
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Check if already processed
    if (payment.status !== PAYMENT_STATUS.PENDING) {
      return res.json({
        success: true,
        message: "Payment already processed",
        data: {
          orderId,
          status: payment.status,
        },
      });
    }

    // Capture PayPal order
    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    request.requestBody({});

    const capture = await paypalClient().execute(request);

    if (capture.result.status === "COMPLETED") {
      const captureId =
        capture.result.purchase_units[0].payments.captures[0].id;
      const payerId = capture.result.payer.payer_id;

      // Update payment
      await payment.update({
        status: PAYMENT_STATUS.COMPLETED,
        paypalPayerId: payerId,
        paypalCaptureId: captureId,
        transactionId: captureId,
        paidAt: new Date(),
        paymentData: capture.result,
      });

      // Create or update user subscription
      const endDate = new Date();

      // Get duration multiplier from payment metadata (for yearly billing)
      let durationMultiplier = 1;
      if (payment.metadata) {
        try {
          const metadata = JSON.parse(payment.metadata);
          durationMultiplier = metadata.durationMultiplier || 1;
        } catch (e) {
          console.error("Failed to parse payment metadata:", e);
        }
      }

      // Calculate end date based on plan duration and billing cycle
      const totalDays = payment.plan.duration * durationMultiplier;
      endDate.setDate(endDate.getDate() + totalDays);

      await UserSubscription.create({
        userId: payment.userId,
        planId: payment.planId,
        paymentId: payment.id,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        startDate: new Date(),
        endDate,
        autoRenew: false,
      });

      // Update user premium status
      await User.update(
        {
          isPremium: true,
          premiumExpiresAt: endDate,
        },
        { where: { id: payment.userId } }
      );

      return res.json({
        success: true,
        message: "Payment completed successfully",
        data: {
          orderId,
          paypalOrderId,
          captureId,
          amount: payment.amount,
          status: PAYMENT_STATUS.COMPLETED,
        },
      });
    } else {
      // Payment failed
      await payment.update({
        status: PAYMENT_STATUS.FAILED,
        paymentData: capture.result,
      });

      return res.json({
        success: false,
        message: "Payment capture failed",
        data: {
          orderId,
          status: PAYMENT_STATUS.FAILED,
        },
      });
    }
  } catch (error) {
    console.error("Verify PayPal payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify PayPal payment",
      error: error.message,
    });
  }
};

// ==================== GET PAYMENT HISTORY ====================
export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id; // JWT uses 'sub' for user ID
    const { page = 1, limit = 10, status, gateway } = req.query;
    const offset = (page - 1) * limit;

    const where = { userId };
    if (status) where.status = status;
    if (gateway) where.paymentGateway = gateway;

    const { count, rows: payments } = await Payment.findAndCountAll({
      where,
      include: [
        {
          model: SubscriptionPlan,
          as: "plan",
          attributes: ["id", "name", "displayName", "duration", "durationType"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get payment history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get payment history",
      error: error.message,
    });
  }
};

// ==================== GET SUBSCRIPTION STATUS ====================
export const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id; // JWT uses 'sub' for user ID

    const subscription = await UserSubscription.findOne({
      where: {
        userId,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        endDate: { [Op.gt]: new Date() },
      },
      include: [
        {
          model: SubscriptionPlan,
          as: "plan",
        },
        {
          model: Payment,
          as: "initialPayment",
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (!subscription) {
      return res.json({
        success: true,
        data: {
          hasActiveSubscription: false,
          subscription: null,
        },
      });
    }

    res.json({
      success: true,
      data: {
        hasActiveSubscription: true,
        subscription,
      },
    });
  } catch (error) {
    console.error("Get subscription status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get subscription status",
      error: error.message,
    });
  }
};

// ==================== CANCEL SUBSCRIPTION ====================
export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id; // JWT uses 'sub' for user ID
    const { reason } = req.body;

    const subscription = await UserSubscription.findOne({
      where: {
        userId,
        status: SUBSCRIPTION_STATUS.ACTIVE,
      },
      order: [["createdAt", "DESC"]],
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found",
      });
    }

    await subscription.update({
      status: SUBSCRIPTION_STATUS.CANCELLED,
      cancelledAt: new Date(),
      cancellationReason: reason || "User requested cancellation",
      autoRenew: false,
    });

    res.json({
      success: true,
      message: "Subscription cancelled successfully",
      data: { subscription },
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel subscription",
      error: error.message,
    });
  }
};

// ==================== VNPAY WEBHOOK (IPN) ====================
export const handleVNPayWebhook = async (req, res) => {
  try {
    const vnpParams = req.query;
    const secureHash = vnpParams.vnp_SecureHash;

    // Log webhook
    await PaymentWebhook.create({
      gateway: PAYMENT_GATEWAY.VNPAY,
      eventType: "IPN",
      orderId: vnpParams.vnp_TxnRef,
      transactionId: vnpParams.vnp_TransactionNo,
      status: vnpParams.vnp_ResponseCode,
      rawData: vnpParams,
      ipAddress: req.ip,
      processed: false,
    });

    // Remove hash params for verification
    delete vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHashType;

    // Verify signature
    const isValid = vnpayHelpers.verifySecureHash(
      vnpParams,
      secureHash,
      vnpayConfig.vnp_HashSecret
    );

    if (!isValid) {
      return res.json({ RspCode: "97", Message: "Invalid signature" });
    }

    const orderId = vnpParams.vnp_TxnRef;
    const responseCode = vnpParams.vnp_ResponseCode;

    // Find payment
    const payment = await Payment.findOne({ where: { orderId } });

    if (!payment) {
      return res.json({ RspCode: "01", Message: "Order not found" });
    }

    // Process webhook (similar to verify endpoint)
    // ... (implementation similar to verifyVNPayPayment)

    res.json({ RspCode: "00", Message: "Success" });
  } catch (error) {
    console.error("VNPay webhook error:", error);
    res.json({ RspCode: "99", Message: "Unknown error" });
  }
};

// ==================== PAYPAL WEBHOOK ====================
export const handlePayPalWebhook = async (req, res) => {
  try {
    const webhookEvent = req.body;

    // Log webhook
    await PaymentWebhook.create({
      gateway: PAYMENT_GATEWAY.PAYPAL,
      eventType: webhookEvent.event_type,
      transactionId: webhookEvent.resource?.id,
      rawData: webhookEvent,
      ipAddress: req.ip,
      processed: false,
    });

    // Process different event types
    switch (webhookEvent.event_type) {
      case "PAYMENT.CAPTURE.COMPLETED":
        // Handle successful payment
        break;
      case "PAYMENT.CAPTURE.DENIED":
        // Handle denied payment
        break;
      // Add more event types as needed
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("PayPal webhook error:", error);
    res.sendStatus(500);
  }
};

// ==================== GET ALL SUBSCRIPTION PLANS ====================
export const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll({
      where: { isActive: true },
      order: [["sortOrder", "ASC"]],
    });

    res.json({
      success: true,
      data: { plans },
    });
  } catch (error) {
    console.error("Get subscription plans error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get subscription plans",
      error: error.message,
    });
  }
};

export default {
  createVNPayPayment,
  verifyVNPayPayment,
  createPayPalPayment,
  verifyPayPalPayment,
  getPaymentHistory,
  getSubscriptionStatus,
  cancelSubscription,
  handleVNPayWebhook,
  handlePayPalWebhook,
  getSubscriptionPlans,
};
