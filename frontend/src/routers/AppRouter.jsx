import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import {
  HomePage,
  AboutPage,
  ContactPage,
  LoginPage,
  RegisterPage,
  PricingPage,
  FindJobPage,
  DashboardPage,
  MyApplicationsPage,
  MyJobsPage,
  ProfilePage,
  NotificationsPage,
  AdminJobModerationPage,
  PostJobPage,
  JobDetailPage,
  ApplyJobPage,
} from "../pages";
import SavedJobsPage from "../pages/SavedJobs/SavedJobsPage";
import JobAlertsPage from "../pages/JobAlerts/JobAlertsPage";
import FindInterpreterPage from "../pages/FindInterpreter/FindInterpreterPage";
import ProtectedRoute from "../components/ProtectedRoute";
import { ROUTES } from "../constants";

// Cấu hình các routes
const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <HomePage />,
  },
  {
    path: ROUTES.NOTIFICATIONS,
    element: (
      <ProtectedRoute>
        <NotificationsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.FIND_JOB,
    element: <FindJobPage />,
  },
  {
    path: ROUTES.FIND_INTERPRETER,
    element: (
      <ProtectedRoute allowedRoles={["client", "admin"]}>
        <FindInterpreterPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.DASHBOARD,
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.MY_APPLICATIONS,
    element: (
      <ProtectedRoute>
        <MyApplicationsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.MY_JOBS,
    element: (
      <ProtectedRoute allowedRoles={["client", "admin"]}>
        <MyJobsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.SAVED_JOBS,
    element: (
      <ProtectedRoute>
        <SavedJobsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.JOB_ALERTS,
    element: (
      <ProtectedRoute>
        <JobAlertsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.PROFILE,
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.ABOUT,
    element: <AboutPage />,
  },
  {
    path: ROUTES.CONTACT,
    element: <ContactPage />,
  },
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  },
  {
    path: ROUTES.REGISTER,
    element: <RegisterPage />,
  },
  {
    path: ROUTES.PRICING,
    element: <PricingPage />,
  },
  {
    path: ROUTES.POST_JOB,
    element: (
      <ProtectedRoute allowedRoles={["client", "admin"]}>
        <PostJobPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_JOB_MODERATION,
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminJobModerationPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.JOB_DETAIL,
    element: <JobDetailPage />,
  },
  {
    path: ROUTES.APPLY_JOB,
    element: (
      <ProtectedRoute>
        <ApplyJobPage />
      </ProtectedRoute>
    ),
  },
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
