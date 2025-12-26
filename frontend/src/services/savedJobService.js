import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

// Get all saved jobs for current user
const getAllSavedJobs = async () => {
  try {
    const token = getAuthToken();
    const userId = JSON.parse(localStorage.getItem("user"))?.id;


    const response = await axios.get(`${API_URL}/saved-jobs`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        userId: userId,
      },
    });

    // Extract data from response
    const data = response.data.data || response.data;

    return {
      success: true,
      data: Array.isArray(data) ? data : [],
    };
  } catch (error) {
    console.error("Error fetching saved jobs:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch saved jobs",
      data: [],
    };
  }
};

// Save a job
const saveJob = async (jobId) => {
  try {
    const token = getAuthToken();
    const userId = JSON.parse(localStorage.getItem("user"))?.id;

    const response = await axios.post(
      `${API_URL}/saved-jobs`,
      { userId, jobId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return {
      success: true,
      data: response.data.data || response.data,
      message: "Job saved successfully",
    };
  } catch (error) {
    console.error("Error saving job:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to save job",
    };
  }
};

// Unsave a job
const unsaveJob = async (jobId) => {
  try {
    const token = getAuthToken();
    const userId = JSON.parse(localStorage.getItem("user"))?.id;

    const response = await axios.delete(
      `${API_URL}/saved-jobs/${userId}/${jobId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return {
      success: true,
      data: response.data.data || response.data,
      message: "Job removed from saved",
    };
  } catch (error) {
    console.error("Error unsaving job:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to unsave job",
    };
  }
};

// Check if a job is saved
const isJobSaved = async (jobId) => {
  try {
    const token = getAuthToken();
    const userId = JSON.parse(localStorage.getItem("user"))?.id;

    const response = await axios.get(
      `${API_URL}/saved-jobs/${userId}/${jobId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return {
      success: true,
      isSaved: !!response.data.data,
    };
  } catch (error) {
    return {
      success: false,
      isSaved: false,
    };
  }
};

const savedJobService = {
  getAllSavedJobs,
  saveJob,
  unsaveJob,
  isJobSaved,
};

export default savedJobService;
