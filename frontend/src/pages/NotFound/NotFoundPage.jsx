import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import "./NotFoundPage.css";

const NotFoundPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <MainLayout>
      <div className="not-found-container">
        <div className="not-found-content">
          <div className="not-found-illustration">
            <h1 className="not-found-code">404</h1>
            <div className="not-found-icon"></div>
          </div>
          <h2 className="not-found-title">{t("errors.notFound.title")}</h2>
          <p className="not-found-description">
            {t("errors.notFound.description")}
          </p>
          <div className="not-found-actions">
            <button
              onClick={() => navigate(-1)}
              className="not-found-button not-found-button-secondary"
            >
              {t("errors.notFound.back")}
            </button>
            <Link to={ROUTES.HOME} className="not-found-button not-found-button-primary">
              {t("errors.notFound.home")}
            </Link>
          </div>
          <div className="not-found-suggestions">
            <p>{t("errors.notFound.suggestions")}</p>
            <ul>
              <li>
                <Link to={ROUTES.FIND_JOB}>{t("errors.notFound.findJob")}</Link>
              </li>
              <li>
                <Link to={ROUTES.PRICING}>{t("errors.notFound.pricing")}</Link>
              </li>
              <li>
                <Link to={ROUTES.ABOUT}>{t("errors.notFound.about")}</Link>
              </li>
              <li>
                <Link to={ROUTES.CONTACT}>{t("errors.notFound.contact")}</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default NotFoundPage;

