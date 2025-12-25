import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../translet/LanguageContext";
import { ROUTES } from "../../constants";
import "./AdminHeader.css";
import { FaSignOutAlt, FaUser, FaGlobe } from "react-icons/fa";

const AdminHeader = () => {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const userDropdownRef = useRef(null);
  const logoutButtonRef = useRef(null);
  const langMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking on logout button
      if (logoutButtonRef.current && logoutButtonRef.current.contains(event.target)) {
        return;
      }
      
      // Check if click is outside user menu (both toggle and dropdown)
      if (
        userMenuRef.current &&
        userDropdownRef.current &&
        !userMenuRef.current.contains(event.target) &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setIsUserMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setIsLangMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsUserMenuOpen(false);
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    setIsLangMenuOpen(false);
  };

  return (
    <header className="admin-header">
      <div className="admin-header-container">
        <div className="admin-header-left">
          <div className="admin-logo" onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}>
            <span className="admin-logo-text">G-Bridge Admin</span>
          </div>
        </div>

        <div className="admin-header-right">
          {/* Language Switcher */}
          <div className="admin-lang-switcher" ref={langMenuRef}>
            <button
              className="admin-lang-toggle"
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              title={lang === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"}
            >
              <FaGlobe />
              <span>{lang === "vi" ? "VI" : "EN"}</span>
            </button>
            {isLangMenuOpen && (
              <div className="admin-lang-dropdown">
                <button
                  className={`admin-lang-option ${lang === "vi" ? "active" : ""}`}
                  onClick={() => handleLanguageChange("vi")}
                >
                  <span>🇻🇳</span>
                  <span>Tiếng Việt</span>
                </button>
                <button
                  className={`admin-lang-option ${lang === "en" ? "active" : ""}`}
                  onClick={() => handleLanguageChange("en")}
                >
                  <span>🇬🇧</span>
                  <span>English</span>
                </button>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="admin-user-info" ref={userMenuRef}>
            <span className="admin-user-name">{user?.fullName || "Admin"}</span>
            <button
              className="admin-user-menu-toggle"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              <FaUser />
            </button>
          </div>

          {isUserMenuOpen && (
            <div className="admin-user-dropdown" ref={userDropdownRef}>
              <div className="admin-user-dropdown-header">
                <div className="admin-user-dropdown-name">{user?.fullName || "Admin"}</div>
                <div className="admin-user-dropdown-email">{user?.email}</div>
              </div>
              <div className="admin-user-dropdown-divider"></div>
              <button
                ref={logoutButtonRef}
                type="button"
                className="admin-user-dropdown-item"
                onClick={handleLogout}
              >
                <FaSignOutAlt />
                <span>{t("common.logout") || "Đăng xuất"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;

