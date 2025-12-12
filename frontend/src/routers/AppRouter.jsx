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
  AdminJobModerationPage,
  AdminDashboardPage,
  AdminRegisterPage,
  CertificateApprovalPage,
  OrganizationApprovalPage,
  SystemNotificationsPage,
  PostJobPage,
  JobDetailPage,
  MessagesPage,
} from "../pages";
import FindInterpreterPage from "../pages/FindInterpreter/FindInterpreterPage";
import SavedJobs from "../pages/Dashboard/SavedJobs/SavedJobs";
import SavedInterpreters from "../pages/Dashboard/SavedInterpreters/SavedInterpreters";
import SettingsPage from "../pages/Dashboard/Settings/SettingsPage";
import NotificationsPage from "../pages/Notifications/NotificationsPage";
import PaymentCallback from "../pages/Payment/PaymentCallback";
import ProtectedRoute from "../components/ProtectedRoute";
import { ROUTES } from "../constants";

// Cấu hình các routes
const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <HomePage />,
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
    path: "/dashboard/saved-jobs",
    element: (
      <ProtectedRoute allowedRoles={["interpreter"]}>
        <SavedJobs />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard/saved-interpreters",
    element: (
      <ProtectedRoute allowedRoles={["client", "admin"]}>
        <SavedInterpreters />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.SETTINGS,
    element: (
      <ProtectedRoute>
        <SettingsPage />
      </ProtectedRoute>
    ),
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
    path: ROUTES.JOB_APPLICATIONS,
    element: (
      <ProtectedRoute allowedRoles={["client", "admin"]}>
        <MyApplicationsPage />
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
    path: ROUTES.ADMIN_REGISTER,
    element: <AdminRegisterPage />,
  },
  {
    path: ROUTES.PRICING,
    element: <PricingPage />,
  },
  {
    path: "/payment/vnpay/callback",
    element: <PaymentCallback />,
  },
  {
    path: "/payment/momo/callback",
    element: <PaymentCallback />,
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
    path: ROUTES.ADMIN_DASHBOARD,
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminDashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_CERTIFICATIONS,
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <CertificateApprovalPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_ORGANIZATIONS,
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <OrganizationApprovalPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.ADMIN_NOTIFICATIONS,
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <SystemNotificationsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.JOB_DETAIL,
    element: <JobDetailPage />,
  },
  {
    path: ROUTES.MESSAGES,
    element: (
      <ProtectedRoute>
        <MessagesPage />
      </ProtectedRoute>
    ),
  },
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
