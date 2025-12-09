import apiClient from "../api/client";

const adminService = {
  // Dashboard Stats
  getDashboardStats: async () => {
    try {
      const response = await apiClient.get("/admin/dashboard/stats");
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to get dashboard stats" };
    }
  },

  // Certificate Approval
  getPendingCertifications: async (params = {}) => {
    try {
      const response = await apiClient.get("/admin/certifications/pending", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to get pending certifications" };
    }
  },

  approveCertification: async (id) => {
    try {
      const response = await apiClient.post(`/admin/certifications/${id}/approve`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to approve certification" };
    }
  },

  rejectCertification: async (id, reason = "") => {
    try {
      const response = await apiClient.post(`/admin/certifications/${id}/reject`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to reject certification" };
    }
  },

  // Organization Approval
  getPendingOrganizations: async (params = {}) => {
    try {
      const response = await apiClient.get("/admin/organizations/pending", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to get pending organizations" };
    }
  },

  approveOrganization: async (id) => {
    try {
      const response = await apiClient.post(`/admin/organizations/${id}/approve`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to approve organization" };
    }
  },

  rejectOrganization: async (id, reason = "") => {
    try {
      const response = await apiClient.post(`/admin/organizations/${id}/reject`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to reject organization" };
    }
  },

  // System Notifications
  createSystemNotification: async (data) => {
    try {
      const response = await apiClient.post("/admin/notifications/system", data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to create system notification" };
    }
  },
};

export default adminService;

