// Enum cho các routes
export const ROUTES = {
  HOME: "/",
  ABOUT: "/about",
  CONTACT: "/contact",
  FIND_JOB: "/find-job",
  DASHBOARD: "/dashboard",
  MY_APPLICATIONS: "/dashboard/applications",
  PRICING: "/pricing",
  LOGIN: "/login",
  REGISTER: "/register",
};

// Enum cho status
export const STATUS = {
  PENDING: "pending",
  SUCCESS: "success",
  ERROR: "error",
  LOADING: "loading",
};

// Enum cho user roles
export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
  MODERATOR: "moderator",
};

// Enum cho languages
export const LANGUAGES = {
  VI: "vi",
  EN: "en",
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: "/auth",
  USERS: "/users",
  POSTS: "/posts",
};
