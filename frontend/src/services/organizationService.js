import apiClient from "../api/client.js";
import { getErrorMessage } from "../utils/errors.js";

const organizationService = {
  getOrganizations: async (params = {}) => {
    try {
      const response = await apiClient.get("/organizations", {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching organizations:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  createOrganization: async (data) => {
    try {
      const response = await apiClient.post("/organizations", data);
      return response.data;
    } catch (error) {
      console.error("Error creating organization:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  updateOrganization: async (id, data) => {
    try {
      const response = await apiClient.put(`/organizations/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating organization:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  getOrganizationById: async (id) => {
    try {
      const response = await apiClient.get(`/organizations/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching organization:", error);
      throw new Error(getErrorMessage(error));
    }
  },
};

export default organizationService;
