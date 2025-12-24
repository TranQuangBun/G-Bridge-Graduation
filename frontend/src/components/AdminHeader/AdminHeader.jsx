import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ROUTES } from "../../constants";
import "./AdminHeader.css";
import { FaSignOutAlt, FaUser } from "react-icons/fa";

const AdminHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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

  return (
    <header className="admin-header">
      <div className="admin-header-container">
        <div className="admin-header-left">
          <div className="admin-logo" onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}>
            <span className="admin-logo-text">G-Bridge Admin</span>
          </div>
        </div>

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

