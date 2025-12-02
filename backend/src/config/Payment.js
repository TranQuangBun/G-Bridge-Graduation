import dotenv from "dotenv";
import crypto from "crypto";
import CryptoJS from "crypto-js";
import moment from "moment";
import querystring from "querystring";

dotenv.config();

export const vnpayConfig = {
  vnp_TmnCode: process.env.VNP_TMN_CODE || "YOUR_TMN_CODE",
  vnp_HashSecret: process.env.VNP_HASH_SECRET || "YOUR_HASH_SECRET",
  vnp_Url:
    process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  vnp_ReturnUrl:
    process.env.VNP_RETURN_URL ||
    "http://localhost:3000/payment/vnpay/callback",
  vnp_IpnUrl:
    process.env.VNP_IPN_URL ||
    "http://localhost:4000/api/payments/webhook/vnpay",
};

export const vnpayHelpers = {
  // VNPay official sortObject function - exactly as in VNPay sample code
  sortObject(obj) {
    const sorted = {};
    const str = [];
    let key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
  },

  createSecureHash(params, secretKey) {
    // VNPay hash calculation - exactly as in official sample code
    // Step 1: Remove vnp_SecureHash and vnp_SecureHashType if present
    const { vnp_SecureHash, vnp_SecureHashType, ...inputData } = params;

    // Step 2: Sort params using VNPay's official sortObject
    // This function encodes both keys and values, and replaces %20 with +
    const sortedData = this.sortObject(inputData);

    // Step 3: Build query string using querystring.stringify
    // This matches VNPay's official implementation: querystring.stringify(vnp_Params, { encode: false })
    // Note: sortedData already has encoded keys and values from sortObject
    const signData = querystring.stringify(sortedData);

    console.log("VNPay Sign Data:", signData);
    console.log("VNPay Sign Data Length:", signData.length);
    console.log("VNPay Secret Key:", secretKey);
    console.log("VNPay Secret Key Length:", secretKey.length);

    // Step 4: Create HMAC SHA512 hash using Buffer (exactly as VNPay sample)
    // VNPay uses: hmac.update(new Buffer(signData, 'utf-8')).digest("hex")
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    console.log("VNPay Secure Hash:", signed);
    console.log("VNPay Secure Hash Length:", signed.length);

    return signed;
  },

  createSecureHashFromQueryString(queryString, secretKey) {
    // Hash directly from URL-encoded query string
    console.log("VNPay Query String (URL-encoded):", queryString);
    console.log("VNPay Secret Key:", secretKey);

    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(queryString, "utf-8")).digest("hex");

    console.log("VNPay Secure Hash:", signed);

    return signed;
  },

  verifySecureHash(data, secureHash, secretKey) {
    const calculatedHash = this.createSecureHash(data, secretKey);
    return calculatedHash === secureHash;
  },

  formatDateTime(date = new Date()) {
    return moment(date).format("YYYYMMDDHHmmss");
  },

  createOrderId(prefix = "ORDER") {
    return `${prefix}_${moment().format("YYYYMMDDHHmmss")}_${Math.floor(
      Math.random() * 10000
    )}`;
  },
};

export const paypalConfig = {
  mode: process.env.PAYPAL_MODE || "sandbox",
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

export const currencyRates = {
  USD: 1,
  VND: 24000,
};

export function convertCurrency(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return amount;

  const amountInUSD = amount / currencyRates[fromCurrency];
  return amountInUSD * currencyRates[toCurrency];
}

export function formatAmount(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

export const PAYMENT_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
  CANCELLED: "cancelled",
};

export const PAYMENT_GATEWAY = {
  VNPAY: "vnpay",
  PAYPAL: "paypal",
};

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
