import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

// Get auth token from localStorage
const getAuthToken = () => {
  // Try both possible token keys for compatibility
  const token =
    localStorage.getItem("authToken") || localStorage.getItem("token");
  return token;
};

// Create axios instance with auth header
const createAuthConfig = () => {
  const token = getAuthToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// ==================== SUBSCRIPTION PLANS ====================

/**
 * Get all available subscription plans
 * @returns {Promise} List of subscription plans
 */
export const getSubscriptionPlans = async () => {
  try {
    const response = await axios.get(`${API_URL}/payments/plans`);
    return response.data;
  } catch (error) {
    console.error("Get subscription plans error:", error);
    throw error.response?.data || error;
  }
};

// ==================== CREATE PAYMENT ====================

/**
 * Create VNPay payment
 * @param {number} planId - Subscription plan ID
 * @returns {Promise} Payment URL and order info
 */
export const createVNPayPayment = async (planId) => {
  try {
    const response = await axios.post(
      `${API_URL}/payments/vnpay/create`,
      { planId },
      createAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Create VNPay payment error:", error);
    throw error.response?.data || error;
  }
};

/**
 * Create PayPal payment
 * @param {number} planId - Subscription plan ID
 * @returns {Promise} PayPal order ID and approval URL
 */
export const createPayPalPayment = async (planId) => {
  try {
    const response = await axios.post(
      `${API_URL}/payments/paypal/create`,
      { planId },
      createAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Create PayPal payment error:", error);
    throw error.response?.data || error;
  }
};

// ==================== VERIFY PAYMENT ====================

/**
 * Verify VNPay payment (called from callback page)
 * @param {Object} queryParams - Query parameters from VNPay redirect
 * @returns {Promise} Payment verification result
 */
export const verifyVNPayPayment = async (queryParams) => {
  try {
    const response = await axios.get(`${API_URL}/payments/vnpay/verify`, {
      params: queryParams,
    });
    return response.data;
  } catch (error) {
    console.error("Verify VNPay payment error:", error);
    throw error.response?.data || error;
  }
};

/**
 * Verify PayPal payment (called after user approves payment)
 * @param {string} orderId - Internal order ID
 * @param {string} paypalOrderId - PayPal order ID
 * @returns {Promise} Payment verification result
 */
export const verifyPayPalPayment = async (orderId, paypalOrderId) => {
  try {
    const response = await axios.post(
      `${API_URL}/payments/paypal/verify`,
      { orderId, paypalOrderId },
      createAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Verify PayPal payment error:", error);
    throw error.response?.data || error;
  }
};

// ==================== PAYMENT HISTORY ====================

/**
 * Get user's payment history
 * @param {Object} params - Query parameters (page, limit, status, gateway)
 * @returns {Promise} Payment history with pagination
 */
export const getPaymentHistory = async (params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/payments/history`, {
      params,
      ...createAuthConfig(),
    });
    return response.data;
  } catch (error) {
    console.error("Get payment history error:", error);
    throw error.response?.data || error;
  }
};

// ==================== SUBSCRIPTION ====================

/**
 * Get current subscription status
 * @returns {Promise} Active subscription info
 */
export const getSubscriptionStatus = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/payments/subscription`,
      createAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Get subscription status error:", error);
    throw error.response?.data || error;
  }
};

/**
 * Cancel current subscription
 * @param {string} reason - Cancellation reason
 * @returns {Promise} Cancellation result
 */
export const cancelSubscription = async (reason = "") => {
  try {
    const response = await axios.post(
      `${API_URL}/payments/subscription/cancel`,
      { reason },
      createAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Cancel subscription error:", error);
    throw error.response?.data || error;
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Map backend plan to frontend format
 * @param {Object} backendPlan - Plan from backend API
 * @param {string} billing - 'monthly' or 'yearly'
 * @returns {Object} Frontend plan format
 */
export const mapPlanToFrontend = (backendPlan, billing = "monthly") => {
  const YEARLY_DISCOUNT = 10; // 10% discount for yearly

  const basePrice = parseFloat(backendPlan.price);
  const isYearly = billing === "yearly";

  let displayPrice = basePrice;
  let priceSuffix = "mo";
  let discountPercent = 0;

  if (isYearly && backendPlan.durationType === "monthly") {
    // Calculate yearly price with discount
    const fullYear = basePrice * 12;
    displayPrice = Math.round(fullYear * (1 - YEARLY_DISCOUNT / 100));
    priceSuffix = "yr";
    discountPercent = basePrice > 0 ? YEARLY_DISCOUNT : 0;
  } else if (backendPlan.durationType === "yearly") {
    displayPrice = basePrice;
    priceSuffix = "yr";
  }

  return {
    id: backendPlan.id,
    key: backendPlan.name,
    name: backendPlan.displayName,
    tag: backendPlan.name.toUpperCase(),
    monthly: basePrice,
    desc: backendPlan.description || "",
    features: backendPlan.features || [],
    displayPrice,
    priceSuffix,
    discountPercent,
    durationType: backendPlan.durationType,
    duration: backendPlan.duration,
    maxInterpreterViews: backendPlan.maxInterpreterViews,
    maxJobPosts: backendPlan.maxJobPosts,
  };
};

/**
 * Check if user needs authentication
 * @returns {boolean} True if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};

/**
 * Redirect to payment gateway
 * @param {string} paymentUrl - Payment URL from gateway
 */
export const redirectToPayment = (paymentUrl) => {
  window.location.href = paymentUrl;
};

const paymentService = {
  getSubscriptionPlans,
  createVNPayPayment,
  createPayPalPayment,
  verifyVNPayPayment,
  verifyPayPalPayment,
  getPaymentHistory,
  getSubscriptionStatus,
  cancelSubscription,
  mapPlanToFrontend,
  isAuthenticated,
  redirectToPayment,
};

export default paymentService;
