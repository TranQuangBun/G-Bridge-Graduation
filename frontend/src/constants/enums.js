// Enum cho các routes
export const ROUTES = {
  HOME: "/",
  ABOUT: "/about",
  CONTACT: "/contact",
  FIND_JOB: "/find-job",
  FIND_INTERPRETER: "/find-interpreter",
  DASHBOARD: "/dashboard",
  MY_APPLICATIONS: "/dashboard/applications",
  SAVED_JOBS: "/dashboard/saved-jobs",
  SAVED_INTERPRETERS: "/dashboard/saved-interpreters",
  JOB_APPLICATIONS: "/dashboard/job-applications",
  SETTINGS: "/settings",
  JOB_ALERTS: "/dashboard/job-alerts",
  NOTIFICATIONS: "/dashboard/notifications",
  ADMIN_JOB_MODERATION: "/admin/jobs/moderation",
  POST_JOB: "/post-job",
  MY_JOBS: "/dashboard/my-jobs",
  PROFILE: "/profile",
  PRICING: "/pricing",
  LOGIN: "/login",
  REGISTER: "/register",
  JOB_DETAIL: "/job/:id",
  MESSAGES: "/messages",
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
