import dotenv from "dotenv";
import crypto from "crypto";
import CryptoJS from "crypto-js";
import moment from "moment";

dotenv.config();

// ==================== VNPAY CONFIGURATION ====================
export const vnpayConfig = {
  vnp_TmnCode: process.env.VNP_TMN_CODE || "YOUR_TMN_CODE", // Merchant Code
  vnp_HashSecret: process.env.VNP_HASH_SECRET || "YOUR_HASH_SECRET", // Hash Secret Key
  vnp_Url:
    process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html", // Payment URL
  vnp_ReturnUrl:
    process.env.VNP_RETURN_URL ||
    "http://localhost:3000/payment/vnpay/callback", // Return URL after payment
  vnp_IpnUrl:
    process.env.VNP_IPN_URL ||
    "http://localhost:4000/api/payments/webhook/vnpay", // IPN URL for webhook
};

// VNPay Helper Functions
export const vnpayHelpers = {
  // Sort object by key
  sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    keys.forEach((key) => {
      sorted[key] = obj[key];
    });
    return sorted;
  },

  // Create secure hash for VNPay
  createSecureHash(data, secretKey) {
    const sortedData = this.sortObject(data);
    const signData = Object.keys(sortedData)
      .map((key) => `${key}=${sortedData[key]}`)
      .join("&");

    const hmac = crypto.createHmac("sha512", secretKey);
    return hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
  },

  // Verify secure hash from VNPay response
  verifySecureHash(data, secureHash, secretKey) {
    const calculatedHash = this.createSecureHash(data, secretKey);
    return calculatedHash === secureHash;
  },

  // Format date for VNPay (yyyyMMddHHmmss)
  formatDateTime(date = new Date()) {
    return moment(date).format("YYYYMMDDHHmmss");
  },

  // Create VNPay order ID
  createOrderId(prefix = "ORDER") {
    return `${prefix}_${moment().format("YYYYMMDDHHmmss")}_${Math.floor(
      Math.random() * 10000
    )}`;
  },
};

// ==================== PAYPAL CONFIGURATION ====================
export const paypalConfig = {
  mode: process.env.PAYPAL_MODE || "sandbox", // sandbox or live
  clientId: process.env.PAYPAL_CLIENT_ID || "YOUR_CLIENT_ID",
  clientSecret: process.env.PAYPAL_CLIENT_SECRET || "YOUR_CLIENT_SECRET",
  returnUrl:
    process.env.PAYPAL_RETURN_URL ||
    "http://localhost:3000/payment/paypal/success",
  cancelUrl:
    process.env.PAYPAL_CANCEL_URL ||
    "http://localhost:3000/payment/paypal/cancel",
  webhookUrl:
    process.env.PAYPAL_WEBHOOK_URL ||
    "http://localhost:4000/api/payments/webhook/paypal",
};

// PayPal Currency Conversion Rates (example - should be fetched from API in production)
export const currencyRates = {
  USD: 1,
  VND: 24000, // 1 USD = 24,000 VND (approximate)
};

// Convert amount between currencies
export function convertCurrency(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return amount;

  const amountInUSD = amount / currencyRates[fromCurrency];
  return amountInUSD * currencyRates[toCurrency];
}

// Format amount for display
export function formatAmount(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

// Payment status mapping
export const PAYMENT_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
  CANCELLED: "cancelled",
};

// Payment gateway enum
export const PAYMENT_GATEWAY = {
  VNPAY: "vnpay",
  PAYPAL: "paypal",
};

// Subscription status enum
export const SUBSCRIPTION_STATUS = {
  ACTIVE: "active",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
  SUSPENDED: "suspended",
};

export default {
  vnpayConfig,
  vnpayHelpers,
  paypalConfig,
  currencyRates,
  convertCurrency,
  formatAmount,
  PAYMENT_STATUS,
  PAYMENT_GATEWAY,
  SUBSCRIPTION_STATUS,
};
