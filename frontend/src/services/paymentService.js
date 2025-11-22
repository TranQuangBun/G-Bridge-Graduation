import apiClient from "../api/client.js";
import { getErrorMessage } from "../utils/errors.js";

const paymentService = {
  // Get subscription plans
  getSubscriptionPlans: async () => {
    try {
      const response = await apiClient.get("/payments/plans");
      return response.data;
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      throw { message: getErrorMessage(error) };
    }
  },

  // Create VNPay payment
  createVNPayPayment: async (planId) => {
    try {
      const response = await apiClient.post("/payments/vnpay/create", { planId });
      return response.data;
    } catch (error) {
      console.error("Error creating VNPay payment:", error);
      throw { message: getErrorMessage(error) };
    }
  },

  // Create PayPal payment
  createPayPalPayment: async (planId) => {
    try {
      const response = await apiClient.post("/payments/paypal/create", { planId });
      return response.data;
    } catch (error) {
      console.error("Error creating PayPal payment:", error);
      throw { message: getErrorMessage(error) };
    }
  },

  // Verify VNPay payment
  verifyVNPayPayment: async (queryParams) => {
    try {
      const params = new URLSearchParams(queryParams);
      const response = await apiClient.get(`/payments/vnpay/verify?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error("Error verifying VNPay payment:", error);
      throw { message: getErrorMessage(error) };
    }
  },

  // Verify PayPal payment
  verifyPayPalPayment: async (orderId) => {
    try {
      const response = await apiClient.post("/payments/paypal/verify", { orderId });
      return response.data;
    } catch (error) {
      console.error("Error verifying PayPal payment:", error);
      throw { message: getErrorMessage(error) };
    }
  },

  // Get payment history
  getPaymentHistory: async () => {
    try {
      const response = await apiClient.get("/payments/history");
      return response.data;
    } catch (error) {
      console.error("Error fetching payment history:", error);
      throw { message: getErrorMessage(error) };
    }
  },

  // Get subscription status
  getSubscriptionStatus: async () => {
    try {
      const response = await apiClient.get("/payments/subscription");
      return response.data;
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      throw { message: getErrorMessage(error) };
    }
  },

  // Cancel subscription
  cancelSubscription: async () => {
    try {
      const response = await apiClient.post("/payments/subscription/cancel");
      return response.data;
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      throw { message: getErrorMessage(error) };
    }
  },
};

export default paymentService;

