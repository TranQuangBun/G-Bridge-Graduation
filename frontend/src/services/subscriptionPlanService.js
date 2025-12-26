import apiClient from "../api/client.js";
import { getErrorMessage } from "../utils/errors.js";

const subscriptionPlanService = {
  // Get all subscription plans
  getAllPlans: async (params = {}) => {
    try {
      const response = await apiClient.get("/subscription-plans", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Get active subscription plans only
  getActivePlans: async () => {
    try {
      const response = await apiClient.get("/subscription-plans", {
        params: { isActive: true },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching active subscription plans:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Get subscription plan by ID
  getPlanById: async (id) => {
    try {
      const response = await apiClient.get(`/subscription-plans/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching subscription plan:", error);
      throw new Error(getErrorMessage(error));
    }
  },
};

export default subscriptionPlanService;

