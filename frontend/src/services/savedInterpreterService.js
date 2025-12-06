import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

// Get all saved interpreters for current user
const getAllSavedInterpreters = async () => {
  try {
    const token = getAuthToken();
    const userId = JSON.parse(localStorage.getItem("user"))?.id;

    console.log("📡 Fetching saved interpreters for userId:", userId);

    const response = await axios.get(`${API_URL}/saved-interpreters`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        userId: userId,
      },
    });

    console.log("📦 Raw API response:", response.data);

    // Extract data from response
    const data = response.data.data || response.data;

    console.log("📊 Extracted data:", data);
    console.log("📊 Is array?", Array.isArray(data));
    if (Array.isArray(data)) {
      console.log("📊 Data length:", data.length);
      console.log("📊 First item:", data[0]);
    }

    return {
      success: true,
      data: Array.isArray(data) ? data : [],
    };
  } catch (error) {
    console.error("❌ Error fetching saved interpreters:", error);
    console.error("❌ Error response:", error.response?.data);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch saved interpreters",
      data: [],
    };
  }
};

// Save an interpreter
const saveInterpreter = async (interpreterId) => {
  try {
    const token = getAuthToken();
    const userId = JSON.parse(localStorage.getItem("user"))?.id;

    const response = await axios.post(
      `${API_URL}/saved-interpreters`,
      { userId, interpreterId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return {
      success: true,
      data: response.data.data || response.data,
      message: "Interpreter saved successfully",
    };
  } catch (error) {
    console.error("Error saving interpreter:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to save interpreter",
    };
  }
};

// Unsave an interpreter
const unsaveInterpreter = async (interpreterId) => {
  try {
    const token = getAuthToken();
    const userId = JSON.parse(localStorage.getItem("user"))?.id;

    const response = await axios.delete(
      `${API_URL}/saved-interpreters/${userId}/${interpreterId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return {
      success: true,
      data: response.data.data || response.data,
      message: "Interpreter removed from saved",
    };
  } catch (error) {
    console.error("Error unsaving interpreter:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to unsave interpreter",
    };
  }
};

// Check if an interpreter is saved
const isInterpreterSaved = async (interpreterId) => {
  try {
    const token = getAuthToken();
    const userId = JSON.parse(localStorage.getItem("user"))?.id;

    const response = await axios.get(
      `${API_URL}/saved-interpreters/${userId}/${interpreterId}`,
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

const savedInterpreterService = {
  getAllSavedInterpreters,
  saveInterpreter,
  unsaveInterpreter,
  isInterpreterSaved,
};

export default savedInterpreterService;
