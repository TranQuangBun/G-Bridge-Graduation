import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ROUTES } from "../constants";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
          color: "#666",
        }}
      >
        <div>
          <div
            className="spinner"
            style={{
              border: "3px solid #f3f3f3",
              borderTop: "3px solid #6366f1",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              animation: "spin 1s linear infinite",
              margin: "0 auto 20px",
            }}
          ></div>
          Loading...
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Check if user is active
  if (user && user.isActive === false) {
    // User account is deactivated, redirect to login with message
    return <Navigate to={ROUTES.LOGIN} state={{ 
      from: location,
      message: "Your account has been deactivated. Please contact support." 
    }} replace />;
  }

  // Block admin from accessing interpreter/client-only pages
  if (user?.role === "admin") {
    // If no allowedRoles specified, this is an interpreter/client page - block admin
    if (allowedRoles.length === 0) {
      return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
    }
    // If allowedRoles doesn't include "admin", block admin access
    if (!allowedRoles.includes("admin")) {
      return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
    }
  }

  // If roles are specified, check if user has required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on role
    if (user?.role === "interpreter") {
      return <Navigate to={ROUTES.DASHBOARD} replace />;
    } else if (user?.role === "client") {
      return <Navigate to={ROUTES.DASHBOARD} replace />;
    } else if (user?.role === "admin") {
      return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
    }
    return <Navigate to={ROUTES.HOME} replace />;
  }

  // User is authenticated and has correct role
  return children;
};

export default ProtectedRoute;
