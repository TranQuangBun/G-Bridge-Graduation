/**
 * LocalStorage helper functions
 */

const STORAGE_KEYS = {
  AUTH_TOKEN: "authToken",
  USER: "user",
  PROFILE: "profile",
  LANGUAGES: "languages",
  CERTIFICATIONS: "certifications",
};

/**
 * Get item from localStorage
 */
export const getStorageItem = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error getting ${key} from storage:`, error);
    return null;
  }
};

/**
 * Set item to localStorage
 */
export const setStorageItem = (key, value) => {
  try {
    const stringValue = JSON.stringify(value);
    localStorage.setItem(key, stringValue);
    // Verify it was saved
    const saved = localStorage.getItem(key);
    if (!saved) {
      throw new Error(`Failed to save ${key} to localStorage`);
    }
    console.log(`Successfully saved ${key} to localStorage`);
  } catch (error) {
    console.error(`Error setting ${key} to storage:`, error);
    // Re-throw to let caller know it failed
    throw error;
  }
};

/**
 * Remove item from localStorage
 */
export const removeStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from storage:`, error);
  }
};

/**
 * Clear all auth-related storage
 */
export const clearAuthStorage = () => {
  Object.values(STORAGE_KEYS).forEach((key) => {
    removeStorageItem(key);
  });
};

/**
 * Auth storage helpers
 */
export const authStorage = {
  getToken: () => {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error("Error getting token from localStorage:", error);
      return null;
    }
  },
  setToken: (token) => {
    try {
      if (!token) {
        console.warn("Attempting to save empty token");
        return;
      }
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      // Verify it was saved
      const saved = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (saved !== token) {
        throw new Error("Token was not saved correctly");
      }
      console.log("Token saved successfully to localStorage");
    } catch (error) {
      console.error("Error saving token to localStorage:", error);
      throw error;
    }
  },
  removeToken: () => removeStorageItem(STORAGE_KEYS.AUTH_TOKEN),

  getUser: () => getStorageItem(STORAGE_KEYS.USER),
  setUser: (user) => setStorageItem(STORAGE_KEYS.USER, user),
  removeUser: () => removeStorageItem(STORAGE_KEYS.USER),

  getProfile: () => getStorageItem(STORAGE_KEYS.PROFILE),
  setProfile: (profile) => setStorageItem(STORAGE_KEYS.PROFILE, profile),
  removeProfile: () => removeStorageItem(STORAGE_KEYS.PROFILE),

  getLanguages: () => getStorageItem(STORAGE_KEYS.LANGUAGES) || [],
  setLanguages: (languages) => setStorageItem(STORAGE_KEYS.LANGUAGES, languages),
  removeLanguages: () => removeStorageItem(STORAGE_KEYS.LANGUAGES),

  getCertifications: () => getStorageItem(STORAGE_KEYS.CERTIFICATIONS) || [],
  setCertifications: (certifications) => setStorageItem(STORAGE_KEYS.CERTIFICATIONS, certifications),
  removeCertifications: () => removeStorageItem(STORAGE_KEYS.CERTIFICATIONS),

  clearAll: clearAuthStorage,
};

