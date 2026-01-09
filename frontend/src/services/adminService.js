import apiClient from "../api/client";

const adminService = {
  // Dashboard Stats
  getDashboardStats: async () => {
    try {
      const response = await apiClient.get("/admin/dashboard/stats");
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || { message: "Failed to get dashboard stats" }
      );
    }
  },

  // Certificate Approval
  getPendingCertifications: async (params = {}) => {
    try {
      const response = await apiClient.get("/admin/certifications/pending", {
        params,
      });
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          message: "Failed to get pending certifications",
        }
      );
    }
  },

  approveCertification: async (id) => {
    try {
      const response = await apiClient.post(
        `/admin/certifications/${id}/approve`
      );
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || { message: "Failed to approve certification" }
      );
    }
  },

  rejectCertification: async (id, reason = "") => {
    try {
      const response = await apiClient.post(
        `/admin/certifications/${id}/reject`,
        { reason }
      );
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || { message: "Failed to reject certification" }
      );
    }
  },

  // Organization Approval
  getOrganizations: async (params = {}) => {
    try {
      const response = await apiClient.get("/admin/organizations", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to get organizations" };
    }
  },

  getPendingOrganizations: async (params = {}) => {
    try {
      const response = await apiClient.get("/admin/organizations/pending", {
        params,
      });
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          message: "Failed to get pending organizations",
        }
      );
    }
  },

  approveOrganization: async (id) => {
    try {
      const response = await apiClient.post(
        `/admin/organizations/${id}/approve`
      );
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || { message: "Failed to approve organization" }
      );
    }
  },

  rejectOrganization: async (id, reason = "") => {
    try {
      const response = await apiClient.post(
        `/admin/organizations/${id}/reject`,
        { reason }
      );
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || { message: "Failed to reject organization" }
      );
    }
  },

  // System Notifications
  getSystemNotifications: async (params = {}) => {
    try {
      const response = await apiClient.get("/admin/notifications/system", {
        params,
      });
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          message: "Failed to get system notifications",
        }
      );
    }
  },

  createSystemNotification: async (data) => {
    try {
      const response = await apiClient.post(
        "/admin/notifications/system",
        data
      );
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          message: "Failed to create system notification",
        }
      );
    }
  },

  // User Management
  getAllUsers: async (params = {}) => {
    try {
      const response = await apiClient.get("/admin/users", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to get users" };
    }
  },

  getUserById: async (id) => {
    try {
      const response = await apiClient.get(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to get user" };
    }
  },

  updateUser: async (id, data) => {
    try {
      const response = await apiClient.put(`/admin/users/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to update user" };
    }
  },

  deleteUser: async (id, reason = "") => {
    try {
      const response = await apiClient.delete(`/admin/users/${id}`, {
        data: { reason },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to delete user" };
    }
  },

  toggleUserStatus: async (id, reason = "") => {
    try {
      const response = await apiClient.patch(
        `/admin/users/${id}/toggle-status`,
        { reason }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to toggle user status" };
    }
  },

  // Revenue Management
  getRevenueStats: async (params = {}) => {
    try {
      const response = await apiClient.get("/admin/revenue/stats", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to get revenue stats" };
    }
  },

  getAllPayments: async (params = {}) => {
    try {
      const response = await apiClient.get("/admin/revenue/payments", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to get payments" };
    }
  },

  // Payment Recovery
  getProblematicPayments: async (params = {}) => {
    try {
      const response = await apiClient.get("/admin/payments/problematic", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to get problematic payments" };
    }
  },

  restorePayment: async (id, reason = "") => {
    try {
      const response = await apiClient.post(`/admin/payments/${id}/restore`, {
        reason,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to restore payment" };
    }
  },
};

export default adminService;
