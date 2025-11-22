/**
 * Error handling utilities
 */

/**
 * Extract error message from error object
 */
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return "An unexpected error occurred";
};

/**
 * Extract error details from error object
 */
export const getErrorDetails = (error) => {
  return {
    message: getErrorMessage(error),
    status: error.response?.status,
    data: error.response?.data,
  };
};

