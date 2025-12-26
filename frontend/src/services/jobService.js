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
      throw new Error(getErrorMessage(error));
    }
  },

  // Get single job by ID
  getJobById: async (id) => {
    try {
      const response = await apiClient.get(`/jobs/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching job:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Apply for a job
  applyForJob: async (jobId, applicationData) => {
    try {
      // If applicationData contains a file, send as FormData
      if (applicationData.pdfFile) {
        const formData = new FormData();
        formData.append("resume", applicationData.pdfFile);
        formData.append("coverLetter", applicationData.coverLetter || "");
        if (applicationData.resumeUrl) {
          formData.append("resumeUrl", applicationData.resumeUrl);
        }
        if (applicationData.resumeType) {
          formData.append("resumeType", applicationData.resumeType);
        }

        const response = await apiClient.post(
          `/jobs/${jobId}/apply`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        return response.data;
      } else {
        // Send as JSON if no file
        const response = await apiClient.post(
          `/jobs/${jobId}/apply`,
          applicationData
        );
        return response.data;
      }
    } catch (error) {
      console.error("Error applying for job:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Toggle save job (save/unsave)
  toggleSaveJob: async (jobId) => {
    try {
      const response = await apiClient.post(`/jobs/${jobId}/save`);
      return response.data;
    } catch (error) {
      console.error("Error toggling save job:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Get saved jobs
  getSavedJobs: async () => {
    try {
      const response = await apiClient.get("/jobs/saved/list");
      return response.data;
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Get my applications
  getMyApplications: async () => {
    try {
      const response = await apiClient.get("/jobs/applications/my");
      return response.data;
    } catch (error) {
      console.error("Error fetching my applications:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Get client's posted jobs
  getClientJobs: async (params = {}) => {
    try {
      const response = await apiClient.get("/jobs/my", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching client jobs:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Accept application (client only)
  acceptApplication: async (applicationId, reviewNotes = "") => {
    try {
      const response = await apiClient.patch(
        `/jobs/applications/${applicationId}/accept`,
        {
          reviewNotes,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error accepting application:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Reject application (client only)
  rejectApplication: async (applicationId, reviewNotes = "") => {
    try {
      const response = await apiClient.patch(
        `/jobs/applications/${applicationId}/reject`,
        {
          reviewNotes,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error rejecting application:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Close job (client only)
  closeJob: async (jobId) => {
    try {
      const response = await apiClient.patch(`/jobs/${jobId}/close`);
      return response.data;
    } catch (error) {
      console.error("Error closing job:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Get lookup data
  getWorkingModes: async () => {
    try {
      const response = await apiClient.get("/jobs/lookup/working-modes");
      return response.data;
    } catch (error) {
      console.error("Error fetching working modes:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  getDomains: async () => {
    try {
      const response = await apiClient.get("/jobs/lookup/domains");
      return response.data;
    } catch (error) {
      console.error("Error fetching domains:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  getLevels: async () => {
    try {
      const response = await apiClient.get("/jobs/lookup/levels");
      return response.data;
    } catch (error) {
      console.error("Error fetching levels:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Create job (admin/client only)
  createJob: async (jobData) => {
    try {
      const response = await apiClient.post("/jobs", jobData);
      return response.data;
    } catch (error) {
      console.error("Error creating job:", error);
      throw new Error(getErrorMessage(error));
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
      throw new Error(getErrorMessage(error));
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
      throw new Error(getErrorMessage(error));
    }
  },

  // Get my posted jobs (client only)
  getMyJobs: async (filters = {}) => {
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

      const response = await apiClient.get(`/jobs/my?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching my jobs:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Update job (admin/client only)
  updateJob: async (jobId, jobData) => {
    try {
      const response = await apiClient.put(`/jobs/${jobId}`, jobData);
      return response.data;
    } catch (error) {
      console.error("Error updating job:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Get applications for a specific job (client only)
  getJobApplications: async (jobId, filters = {}) => {
    try {
      const params = new URLSearchParams();
      params.append("jobId", jobId);

      Object.keys(filters).forEach((key) => {
        if (
          filters[key] !== undefined &&
          filters[key] !== null &&
          filters[key] !== ""
        ) {
          params.append(key, filters[key]);
        }
      });

      const response = await apiClient.get(
        `/job-applications?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching job applications:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Request job completion
  requestJobCompletion: async (applicationId) => {
    try {
      const response = await apiClient.post(
        `/job-applications/${applicationId}/request-completion`
      );
      return response.data;
    } catch (error) {
      console.error("Error requesting job completion:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Confirm job completion
  confirmJobCompletion: async (applicationId) => {
    try {
      const response = await apiClient.post(
        `/job-applications/${applicationId}/confirm-completion`
      );
      return response.data;
    } catch (error) {
      console.error("Error confirming job completion:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Cancel job completion request
  cancelJobCompletionRequest: async (applicationId) => {
    try {
      const response = await apiClient.post(
        `/job-applications/${applicationId}/cancel-completion`
      );
      return response.data;
    } catch (error) {
      console.error("Error cancelling job completion request:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Get public statistics for homepage
  getPublicStats: async () => {
    try {
      const response = await apiClient.get("/jobs/stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching public stats:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  // Get featured jobs for homepage
  getFeaturedJobs: async (limit = 9) => {
    try {
      const response = await apiClient.get(`/jobs/featured?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching featured jobs:", error);
      throw new Error(getErrorMessage(error));
    }
  },
};

export default jobService;
