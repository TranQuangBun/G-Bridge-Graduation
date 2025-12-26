/**
 * Logger utility with standard logging format
 * Format: [TIMESTAMP] [LEVEL] message
 */

const getTimestamp = () => {
  return new Date().toISOString();
};

const formatLog = (level, message, data = null) => {
  const timestamp = getTimestamp();
  const logEntry = {
    timestamp,
    level,
    message,
    ...(data && { data }),
  };
  
  return JSON.stringify(logEntry);
};

export const logger = {
  info: (message, data = null) => {
    console.log(formatLog("INFO", message, data));
  },
  
  error: (message, error = null) => {
    const errorData = error
      ? {
          message: error.message,
          stack: error.stack,
          ...(error.code && { code: error.code }),
        }
      : null;
    console.error(formatLog("ERROR", message, errorData));
  },
  
  warn: (message, data = null) => {
    console.warn(formatLog("WARN", message, data));
  },
  
  debug: (message, data = null) => {
    if (process.env.NODE_ENV === "development") {
      console.log(formatLog("DEBUG", message, data));
    }
  },
};

