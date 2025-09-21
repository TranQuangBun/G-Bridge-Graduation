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
} from "../pages";
import SavedJobsPage from "../pages/SavedJobs/SavedJobsPage";
import JobAlertsPage from "../pages/JobAlerts/JobAlertsPage";
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
    path: ROUTES.DASHBOARD,
    element: <DashboardPage />,
  },
  {
    path: ROUTES.MY_APPLICATIONS,
    element: <MyApplicationsPage />,
  },
  {
    path: ROUTES.SAVED_JOBS,
    element: <SavedJobsPage />,
  },
  {
    path: ROUTES.JOB_ALERTS,
    element: <JobAlertsPage />,
  },
  {
    path: ROUTES.PROFILE,
    element: <ProfilePage />,
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
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
