import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ROUTES } from "../../constants";
import "./AdminHeader.css";
import { FaBars, FaTimes, FaSignOutAlt, FaUser } from "react-icons/fa";

const AdminHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    { path: ROUTES.ADMIN_DASHBOARD, label: "Dashboard", icon: "" },
    { path: ROUTES.ADMIN_CERTIFICATIONS, label: "Duyệt chứng chỉ", icon: "" },
    { path: ROUTES.ADMIN_ORGANIZATIONS, label: "Duyệt tổ chức", icon: "" },
    { path: ROUTES.ADMIN_JOB_MODERATION, label: "Duyệt công việc", icon: "" },
    { path: ROUTES.ADMIN_NOTIFICATIONS, label: "Thông báo hệ thống", icon: "" },
  ];

  return (
    <header className="admin-header">
      <div className="admin-header-container">
        <div className="admin-header-left">
          <button
            className="admin-mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
          <div className="admin-logo" onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}>
            <span className="admin-logo-icon">🔐</span>
            <span className="admin-logo-text">G-Bridge Admin</span>
          </div>
        </div>

        <nav className={`admin-nav ${isMobileMenuOpen ? "mobile-open" : ""}`}>
          {menuItems.map((item) => (
            <button
              key={item.path}
              className={`admin-nav-item ${isActive(item.path) ? "active" : ""}`}
              onClick={() => {
                navigate(item.path);
                setIsMobileMenuOpen(false);
              }}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span className="admin-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-header-right" ref={userMenuRef}>
          <div className="admin-user-info">
            <span className="admin-user-name">{user?.fullName || "Admin"}</span>
            <button
              className="admin-user-menu-toggle"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              <FaUser />
            </button>
          </div>

          {isUserMenuOpen && (
            <div className="admin-user-dropdown">
              <div className="admin-user-dropdown-header">
                <div className="admin-user-dropdown-name">{user?.fullName || "Admin"}</div>
                <div className="admin-user-dropdown-email">{user?.email}</div>
              </div>
              <div className="admin-user-dropdown-divider"></div>
              <button
                className="admin-user-dropdown-item"
                onClick={handleLogout}
              >
                <FaSignOutAlt />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;

