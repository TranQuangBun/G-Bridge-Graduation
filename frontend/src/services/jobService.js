import apiClient from "../api/client.js";
import { getErrorMessage } from "../utils/errors.js";

const jobService = {
  // Get all jobs with filters
  getJobs: async (filters = {}) => {
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

      const response = await apiClient.get(`/jobs?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching jobs:", error);
      throw { message: getErrorMessage(error) };
    }
  },

  // Get single job by ID
  getJobById: async (id) => {
    try {
      const response = await apiClient.get(`/jobs/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching job:", error);
      throw { message: getErrorMessage(error) };
    }
  },

  // Apply for a job
  applyForJob: async (jobId, applicationData) => {
    try {
      const response = await apiClient.post(`/jobs/${jobId}/apply`, applicationData);
      return response.data;
    } catch (error) {
      console.error("Error applying for job:", error);
      throw { message: getErrorMessage(error) };
    }
  },

  // Toggle save job (save/unsave)
  toggleSaveJob: async (jobId) => {
    try {
      const response = await apiClient.post(`/jobs/${jobId}/save`);
      return response.data;
    } catch (error) {
      console.error("Error toggling save job:", error);
      throw { message: getErrorMessage(error) };
    }
  },

  // Get saved jobs
  getSavedJobs: async () => {
    try {
      const response = await apiClient.get("/jobs/saved/list");
      return response.data;
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
      throw { message: getErrorMessage(error) };
    }
  },

  // Get my applications
  getMyApplications: async () => {
    try {
      const response = await apiClient.get("/jobs/applications/my");
      return response.data;
    } catch (error) {
      console.error("Error fetching my applications:", error);
      throw { message: getErrorMessage(error) };
    }
  },

  // Accept application (client only)
  acceptApplication: async (applicationId, reviewNotes = "") => {
    try {
      const response = await apiClient.patch(`/jobs/applications/${applicationId}/accept`, {
        reviewNotes,
      });
      return response.data;
    } catch (error) {
      console.error("Error accepting application:", error);
      throw { message: getErrorMessage(error) };
    }
  },

  // Reject application (client only)
  rejectApplication: async (applicationId, reviewNotes = "") => {
    try {
      const response = await apiClient.patch(`/jobs/applications/${applicationId}/reject`, {
        reviewNotes,
      });
      return response.data;
    } catch (error) {
      console.error("Error rejecting application:", error);
      throw { message: getErrorMessage(error) };
    }
  },

  // Get lookup data
  getWorkingModes: async () => {
    try {
      const response = await apiClient.get("/jobs/lookup/working-modes");
      return response.data;
    } catch (error) {
      console.error("Error fetching working modes:", error);
      throw { message: getErrorMessage(error) };
    }
  },

  getDomains: async () => {
    try {
      const response = await apiClient.get("/jobs/lookup/domains");
      return response.data;
    } catch (error) {
      console.error("Error fetching domains:", error);
      throw { message: getErrorMessage(error) };
    }
  },

  getLevels: async () => {
    try {
      const response = await apiClient.get("/jobs/lookup/levels");
      return response.data;
    } catch (error) {
      console.error("Error fetching levels:", error);
      throw { message: getErrorMessage(error) };
    }
  },

  // Create job (admin/client only)
  createJob: async (jobData) => {
    try {
      const response = await apiClient.post("/jobs", jobData);
      return response.data;
    } catch (error) {
      console.error("Error creating job:", error);
      throw { message: getErrorMessage(error) };
    }
  },

  // Approve job (admin only)
  approveJob: async (jobId, reviewNotes = "") => {
    try {
      const response = await apiClient.patch(`/jobs/${jobId}/approve`, {
        reviewNotes,
      });
      return response.data;
    } catch (error) {
      console.error("Error approving job:", error);
      throw { message: getErrorMessage(error) };
    }
  },

  // Reject job (admin only)
  rejectJob: async (jobId, reviewNotes = "") => {
    try {
      const response = await apiClient.patch(`/jobs/${jobId}/reject`, {
        reviewNotes,
      });
      return response.data;
    } catch (error) {
      console.error("Error rejecting job:", error);
      throw { message: getErrorMessage(error) };
    }
  },
};

export default jobService;
