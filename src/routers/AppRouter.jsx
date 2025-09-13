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
} from "../pages";
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
    // Support route removed
  },
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
