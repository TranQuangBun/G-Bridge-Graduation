/**
 * Common validation helpers
 */

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate required fields
 */
export const validateRequired = (data, requiredFields) => {
  const missing = [];
  requiredFields.forEach((field) => {
    if (!data[field] || (typeof data[field] === "string" && data[field].trim() === "")) {
      missing.push(field);
    }
  });
  return missing;
};

/**
 * Validate role
 */
export const isValidRole = (role) => {
  return ["admin", "client", "interpreter"].includes(role);
};

