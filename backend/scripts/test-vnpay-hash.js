import crypto from "crypto";

// Test VNPay hash calculation
// Use this to verify your hash calculation matches VNPay's expectation

const testParams = {
  vnp_Amount: 24000000,
  vnp_Command: "pay",
  vnp_CreateDate: "20251129034441",
  vnp_CurrCode: "VND",
  vnp_IpAddr: "127.0.0.1",
  vnp_Locale: "vn",
  vnp_OrderInfo: "Payment_for_pro",
  vnp_OrderType: "other",
  vnp_ReturnUrl: "http://localhost:3000/payment/vnpay/callback",
  vnp_TmnCode: "HZO7L9T6",
  vnp_TxnRef: "VNPAY_20251129034441_3312",
  vnp_Version: "2.1.0",
};

const secretKey = "38ZOFK4XR7GE8F3L3PLONS6ZXKG162EG";

function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  keys.forEach((key) => {
    sorted[key] = obj[key];
  });
  return sorted;
}

function createSecureHash(params, secretKey) {
  // Remove vnp_SecureHash if present
  const { vnp_SecureHash, vnp_SecureHashType, ...inputData } = params;

  // Sort params alphabetically
  const sortedData = sortObject(inputData);

  // Build query string
  const signData = Object.keys(sortedData)
    .filter(
      (key) =>
        sortedData[key] !== null &&
        sortedData[key] !== undefined &&
        sortedData[key] !== ""
    )
    .map((key) => `${key}=${String(sortedData[key])}`)
    .join("&");

  console.log("Sign Data:", signData);
  console.log("Secret Key:", secretKey);

  // Create HMAC SHA512 hash
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  return signed;
}

const hash = createSecureHash(testParams, secretKey);
console.log("\n=== VNPay Hash Test ===");
console.log("Calculated Hash:", hash);
console.log("\nTo verify:");
console.log("1. Check if this hash matches what VNPay expects");
console.log("2. Verify your Hash Secret is correct in VNPay dashboard");
console.log("3. Make sure TMN Code matches: HZO7L9T6");

