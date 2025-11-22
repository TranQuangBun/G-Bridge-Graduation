import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import "./Header.css";
import NotificationDropdown from "../NotificationDropdown/NotificationDropdown";
import VNFlag from "../../assets/images/languages/VN.png";
import USFlag from "../../assets/images/languages/US.png";
import { useLanguage } from "../../translet/LanguageContext";

const Header = () => {
  const { lang, setLang, t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMobileMenu = () => setIsMobileMenuOpen((o) => !o);
  const toggleLanguage = () => setLang(lang === "vi" ? "en" : "vi");
  const toggleUserMenu = () => setIsUserMenuOpen((prev) => !prev);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate(ROUTES.HOME);
  };

  const handleProfileClick = () => {
    setIsUserMenuOpen(false);
    if (user?.role === "interpreter") {
      navigate("/profile");
    } else if (user?.role === "client") {
      navigate("/company/profile");
    } else if (user?.role === "admin") {
      navigate("/admin/profile");
    }
  };

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

              {/* Show Find Interpreter for Company, Find Job for Interpreter */}
              {user?.role === "client" ? (
                <Link
                  to={ROUTES.FIND_INTERPRETER}
                  className={`nav-item ${
                    isActiveRoute(ROUTES.FIND_INTERPRETER) ? "active" : ""
                  }`}
                >
                  <span>{t("common.findInterpreter")}</span>
                </Link>
              ) : (
                <Link
                  to={ROUTES.FIND_JOB}
                  className={`nav-item ${
                    isActiveRoute(ROUTES.FIND_JOB) ? "active" : ""
                  }`}
                >
                  <span>{t("common.findJob")}</span>
                </Link>
              )}

              <Link
                to={ROUTES.DASHBOARD}
                className={`nav-item ${
                  isActiveRoute(ROUTES.DASHBOARD) ? "active" : ""
                }`}
              >
                <span>{t("common.dashboard")}</span>
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
              {isAuthenticated ? (
                <div className="user-actions" ref={userMenuRef}>
                  {/* Post Job Button - Only for Company/Client */}
                  {user?.role === "client" && (
                    <Link to={ROUTES.POST_JOB} className="post-job-btn">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                      </svg>
                      <span>{t("common.postJob")}</span>
                    </Link>
                  )}

                  <NotificationDropdown />

                  {/* User Avatar Dropdown */}
                  <div className="user-menu-container">
                    <button
                      className="user-avatar-btn"
                      onClick={toggleUserMenu}
                    >
                      {user?.avatar ? (
                        <img
                          src={
                            user.avatar.startsWith("http")
                              ? user.avatar
                              : `http://localhost:4000${user.avatar}`
                          }
                          alt={user.fullName}
                          className="avatar-image"
                        />
                      ) : (
                        <div className="avatar-placeholder">
                          {user?.fullName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                      )}
                    </button>

                    {/* Dropdown Menu */}
                    {isUserMenuOpen && (
                      <div className="user-dropdown">
                        <div className="user-dropdown-header">
                          <div className="user-info">
                            {user?.avatar ? (
                              <img
                                src={
                                  user.avatar.startsWith("http")
                                    ? user.avatar
                                    : `http://localhost:4000${user.avatar}`
                                }
                                alt={user.fullName}
                                className="dropdown-avatar"
                              />
                            ) : (
                              <div className="dropdown-avatar-placeholder">
                                {user?.fullName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                              </div>
                            )}
                            <div className="user-details">
                              <p className="user-name">
                                {user?.fullName || "User"}
                              </p>
                              <p className="user-email">{user?.email}</p>
                              <span className="user-role-badge">
                                {user?.role}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="user-dropdown-divider"></div>
                        <div className="user-dropdown-menu">
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              navigate(ROUTES.NOTIFICATIONS);
                            }}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                            </svg>
                            <span>
                              {t("dashboard.notifications.title") ||
                                t("common.notifications")}
                            </span>
                          </button>
                          <button
                            className="dropdown-item"
                            onClick={handleProfileClick}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                              <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <span>
                              {lang === "vi" ? "Hồ sơ của tôi" : "My Profile"}
                            </span>
                          </button>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              navigate(ROUTES.DASHBOARD);
                            }}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <rect x="3" y="3" width="7" height="7"></rect>
                              <rect x="14" y="3" width="7" height="7"></rect>
                              <rect x="14" y="14" width="7" height="7"></rect>
                              <rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                            <span>{t("common.dashboard")}</span>
                          </button>
                          {user?.role === "interpreter" && (
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                navigate("/saved-jobs");
                              }}
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                              </svg>
                              <span>
                                {lang === "vi"
                                  ? "Công việc đã lưu"
                                  : "Saved Jobs"}
                              </span>
                            </button>
                          )}
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              navigate("/settings");
                            }}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="12" r="3"></circle>
                              <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"></path>
                            </svg>
                            <span>
                              {lang === "vi" ? "Cài đặt" : "Settings"}
                            </span>
                          </button>
                        </div>
                        <div className="user-dropdown-divider"></div>
                        <div className="user-dropdown-footer">
                          <button
                            className="dropdown-item logout-item"
                            onClick={handleLogout}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                              <polyline points="16 17 21 12 16 7"></polyline>
                              <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            <span>
                              {lang === "vi" ? "Đăng xuất" : "Logout"}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <Link to={ROUTES.LOGIN} className="login-btn">
                    {t("common.login")}
                  </Link>
                  <Link to={ROUTES.REGISTER} className="register-btn">
                    <span>{t("common.register")}</span>
                    <div className="btn-glow"></div>
                  </Link>
                </>
              )}
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
                to={ROUTES.DASHBOARD}
                className={`mobile-nav-item ${
                  isActiveRoute(ROUTES.DASHBOARD) ? "active" : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t("common.dashboard")}
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
              {isAuthenticated ? (
                <div className="mobile-user-section">
                  <div className="mobile-user-info">
                    {user?.avatar ? (
                      <img
                        src={
                          user.avatar.startsWith("http")
                            ? user.avatar
                            : `http://localhost:4000${user.avatar}`
                        }
                        alt={user.fullName}
                        className="mobile-avatar"
                      />
                    ) : (
                      <div className="mobile-avatar-placeholder">
                        {user?.fullName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    )}
                    <div className="mobile-user-details">
                      <p className="mobile-user-name">{user?.fullName}</p>
                      <p className="mobile-user-email">{user?.email}</p>
                    </div>
                  </div>
                  <div className="mobile-user-actions">
                    {/* Post Job Button - Only for Company */}
                    {user?.role === "client" && (
                      <Link
                        to={ROUTES.POST_JOB}
                        className="mobile-post-job-btn"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="16"></line>
                          <line x1="8" y1="12" x2="16" y2="12"></line>
                        </svg>
                        {t("common.postJob")}
                      </Link>
                    )}

                    <button
                      className="mobile-menu-action"
                      onClick={() => {
                        handleProfileClick();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      {lang === "vi" ? "Hồ sơ" : "Profile"}
                    </button>
                    <button
                      className="mobile-menu-action"
                      onClick={() => {
                        navigate(ROUTES.NOTIFICATIONS);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M13 10V3L4 14h7v7l9-11z"></path>
                      </svg>
                      {t("dashboard.notifications.title") ||
                        t("common.notifications")}
                    </button>
                    <button
                      className="mobile-menu-action"
                      onClick={() => {
                        navigate("/settings");
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"></path>
                      </svg>
                      {lang === "vi" ? "Cài đặt" : "Settings"}
                    </button>
                    <button
                      className="mobile-menu-action logout"
                      onClick={handleLogout}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      {lang === "vi" ? "Đăng xuất" : "Logout"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
