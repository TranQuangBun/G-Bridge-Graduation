import React from "react";
import { Link, useNavigate, useRouteError } from "react-router-dom";
import { ROUTES } from "../../constants";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import "./ErrorPage.css";

const ErrorPage = () => {
  const error = useRouteError();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const getErrorInfo = () => {
    if (error?.status === 404) {
      return {
        title: t("errors.error.notFound.title"),
        message: t("errors.error.notFound.message"),
        code: 404,
      };
    }

    if (error?.status === 500 || error?.status >= 500) {
      return {
        title: t("errors.error.server.title"),
        message: t("errors.error.server.message"),
        code: error.status || 500,
      };
    }

    if (error?.status === 403) {
      return {
        title: t("errors.error.forbidden.title"),
        message: t("errors.error.forbidden.message"),
        code: 403,
      };
    }

    if (error?.status === 401) {
      return {
        title: t("errors.error.unauthorized.title"),
        message: t("errors.error.unauthorized.message"),
        code: 401,
      };
    }

    // Network errors
    if (error?.message?.includes("Network") || error?.message?.includes("fetch")) {
      return {
        title: t("errors.error.network.title"),
        message: t("errors.error.network.message"),
        code: "NETWORK_ERROR",
      };
    }

    // Generic error
    return {
      title: t("errors.error.generic.title"),
      message: error?.message || t("errors.error.generic.message"),
      code: error?.status || "ERROR",
    };
  };

  const errorInfo = getErrorInfo();

  return (
    <MainLayout>
      <div className="error-container">
        <div className="error-content">
          <div className="error-illustration">
            <h1 className="error-code">{errorInfo.code}</h1>
            <div className="error-icon"></div>
          </div>
          <h2 className="error-title">{errorInfo.title}</h2>
          <p className="error-description">{errorInfo.message}</p>
          <div className="error-actions">
            <button
              onClick={() => navigate(-1)}
              className="error-button error-button-secondary"
            >
              {t("errors.error.back")}
            </button>
            <Link to={ROUTES.HOME} className="error-button error-button-primary">
              {t("errors.error.home")}
            </Link>
          </div>
          {process.env.NODE_ENV === "development" && error && (
            <details className="error-details">
              <summary>{t("errors.error.details")}</summary>
              <pre>{JSON.stringify(error, null, 2)}</pre>
            </details>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ErrorPage;

