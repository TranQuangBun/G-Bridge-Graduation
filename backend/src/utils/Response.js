/**
 * Standard API response helpers
 */

/**
 * Send success response
 */
export const sendSuccess = (res, data, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send error response
 */
export const sendError = (res, message = "Error", statusCode = 400, error = null) => {
  const response = {
    success: false,
    message,
  };

  if (error && process.env.NODE_ENV === "development") {
    response.error = error.message || error;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send paginated response
 */
export const sendPaginated = (res, data, pagination, message = "Success") => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: parseInt(pagination.page) || 1,
      limit: parseInt(pagination.limit) || 10,
      total: pagination.total || 0,
      totalPages: Math.ceil((pagination.total || 0) / (parseInt(pagination.limit) || 10)),
    },
  });
};

