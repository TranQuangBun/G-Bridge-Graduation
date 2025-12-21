import apiClient from "../api/client.js";
import { getErrorMessage } from "../utils/errors.js";

const interpreterService = {
  // Get all interpreters with filters
  getInterpreters: async (filters = {}) => {
    try {
      const params = new URLSearchParams();

      Object.keys(filters).forEach((key) => {
        if (
          filters[key] !== undefined &&
          filters[key] !== null &&
          filters[key] !== ""
        ) {
          params.append(key, filters[key]);
        }
      });

      const url = `/interpreters?${params.toString()}`;

      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching interpreters:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Get single interpreter by ID
  getInterpreterById: async (id) => {
    try {
      const response = await apiClient.get(`/interpreters/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching interpreter:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Get available languages for filter
  getAvailableLanguages: async () => {
    try {
      const response = await apiClient.get("/interpreters/languages");
      return response.data;
    } catch (error) {
      console.error("Error fetching languages:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Get available specializations for filter
  getAvailableSpecializations: async () => {
    try {
      const response = await apiClient.get("/interpreters/specializations");
      return response.data;
    } catch (error) {
      console.error("Error fetching specializations:", error);
      throw new Error(getErrorMessage(error));
    }
  },
};

export default interpreterService;
