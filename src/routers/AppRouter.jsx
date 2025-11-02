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
  ProfilePage,
  PostJobPage,
} from "../pages";
import SavedJobsPage from "../pages/Dashboard/SavedJobsPage";
import JobAlertsPage from "../pages/JobAlerts/JobAlertsPage";
import FindInterpreterPage from "../pages/FindInterpreter/FindInterpreterPage";
import CompanyProfilePage from "../pages/CompanyProfile";
import PaymentSuccessPage from "../pages/PaymentSuccess";
import PaymentCancelPage from "../pages/PaymentCancel";
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
    path: ROUTES.POST_JOB,
    element: (
      <ProtectedRoute allowedRoles={["client", "admin"]}>
        <PostJobPage />
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
    path: ROUTES.COMPANY_PROFILE,
    element: (
      <ProtectedRoute allowedRoles={["client"]}>
        <CompanyProfilePage />
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
    path: "/payment/vnpay/callback",
    element: <PaymentSuccessPage />,
  },
  {
    path: "/payment/paypal/success",
    element: <PaymentSuccessPage />,
  },
  {
    path: "/payment/paypal/cancel",
    element: <PaymentCancelPage />,
  },
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
