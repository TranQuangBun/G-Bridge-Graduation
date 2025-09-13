import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ROUTES } from "../../constants";
import "./Header.css";
import VNFlag from "../../assets/images/languages/VN.png";
import USFlag from "../../assets/images/languages/US.png";
import { useLanguage } from "../../translet/LanguageContext";

const Header = () => {
  const { lang, setLang, t } = useLanguage();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleMobileMenu = () => setIsMobileMenuOpen((o) => !o);
  const toggleLanguage = () => setLang(lang === "vi" ? "en" : "vi");

  // Function to check if a route is active
  const isActiveRoute = (route) => {
    return location.pathname === route;
  };

  return (
    <header className={`modern-header ${isScrolled ? "scrolled" : ""}`}>
      <div className="header-background">
        <div className="header-shape"></div>
        <div className="header-glow"></div>
      </div>
      <div className="header-container">
        <div className="header-content">
          <div className="logo-section">
            <Link to={ROUTES.HOME} className="logo-link">
              <div className="logo-icon">
                <span className="logo-text">G</span>
              </div>
              <span className="brand-name">G-Bridge</span>
            </Link>
          </div>
          <nav className="desktop-nav">
            <div className="nav-links">
              <Link
                to={ROUTES.HOME}
                className={`nav-item ${
                  isActiveRoute(ROUTES.HOME) ? "active" : ""
                }`}
              >
                <span>{t("common.home")}</span>
              </Link>
              <Link
                to={ROUTES.FIND_JOB}
                className={`nav-item ${
                  isActiveRoute(ROUTES.FIND_JOB) ? "active" : ""
                }`}
              >
                <span>{t("common.findJob")}</span>
              </Link>
              <Link
                to="/candidates"
                className={`nav-item ${
                  isActiveRoute("/candidates") ? "active" : ""
                }`}
              >
                <span>{t("common.candidates")}</span>
              </Link>
              <Link
                to="/pricing"
                className={`nav-item ${
                  isActiveRoute("/pricing") ? "active" : ""
                }`}
              >
                <span>{t("common.pricing")}</span>
              </Link>
            </div>
            <div className="language-switcher">
              <button
                className="flag-btn active"
                onClick={toggleLanguage}
                title={
                  lang === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"
                }
              >
                <img
                  src={lang === "vi" ? VNFlag : USFlag}
                  alt={lang === "vi" ? "Vietnamese" : "English"}
                  className="flag-image"
                />
              </button>
            </div>
            <div className="auth-section">
              <Link to={ROUTES.LOGIN} className="login-btn">
                {t("common.login")}
              </Link>
              <Link to={ROUTES.REGISTER} className="register-btn">
                <span>{t("common.register")}</span>
                <div className="btn-glow"></div>
              </Link>
            </div>
          </nav>
          <button
            className={`mobile-menu-btn ${isMobileMenuOpen ? "active" : ""}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        <div className={`mobile-nav ${isMobileMenuOpen ? "active" : ""}`}>
          <div className="mobile-nav-content">
            <div className="mobile-language-switcher">
              <button
                className="mobile-flag-btn active"
                onClick={toggleLanguage}
                title={
                  lang === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"
                }
              >
                <img
                  src={lang === "vi" ? VNFlag : USFlag}
                  alt={lang === "vi" ? "Vietnamese" : "English"}
                  className="mobile-flag-image"
                />
                {lang === "vi" ? "Tiếng Việt" : "English"}
              </button>
            </div>
            <div className="mobile-links">
              <Link
                to={ROUTES.HOME}
                className={`mobile-nav-item ${
                  isActiveRoute(ROUTES.HOME) ? "active" : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t("common.home")}
              </Link>
              <Link
                to={ROUTES.FIND_JOB}
                className={`mobile-nav-item ${
                  isActiveRoute(ROUTES.FIND_JOB) ? "active" : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t("common.findJob")}
              </Link>
              <Link
                to="/candidates"
                className={`mobile-nav-item ${
                  isActiveRoute("/candidates") ? "active" : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t("common.candidates")}
              </Link>
              <Link
                to="/pricing"
                className={`mobile-nav-item ${
                  isActiveRoute("/pricing") ? "active" : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t("common.pricing")}
              </Link>
            </div>
            <div className="mobile-auth">
              <Link
                to={ROUTES.LOGIN}
                className="mobile-login-btn"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t("common.login")}
              </Link>
              <Link
                to={ROUTES.REGISTER}
                className="mobile-register-btn"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t("common.register")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
