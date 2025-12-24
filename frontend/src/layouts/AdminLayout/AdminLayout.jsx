import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "../../constants";
import AdminHeader from "../../components/AdminHeader/AdminHeader";
import {
  FaChartBar,
  FaCertificate,
  FaBuilding,
  FaBriefcase,
  FaBell,
  FaUsers,
  FaDollarSign,
} from "react-icons/fa";
import "./AdminLayout.css";

const ADMIN_MENU = [
  {
    id: "dashboard",
    path: ROUTES.ADMIN_DASHBOARD,
    icon: FaChartBar,
    label: "Dashboard",
  },
  {
    id: "certifications",
    path: ROUTES.ADMIN_CERTIFICATIONS,
    icon: FaCertificate,
    label: "Duyệt chứng chỉ",
  },
  {
    id: "organizations",
    path: ROUTES.ADMIN_ORGANIZATIONS,
    icon: FaBuilding,
    label: "Duyệt tổ chức",
  },
  {
    id: "jobs",
    path: ROUTES.ADMIN_JOB_MODERATION,
    icon: FaBriefcase,
    label: "Duyệt công việc",
  },
  {
    id: "users",
    path: ROUTES.ADMIN_USERS,
    icon: FaUsers,
    label: "Quản lý người dùng",
  },
  {
    id: "revenue",
    path: ROUTES.ADMIN_REVENUE,
    icon: FaDollarSign,
    label: "Quản lý doanh thu",
  },
  {
    id: "notifications",
    path: ROUTES.ADMIN_NOTIFICATIONS,
    icon: FaBell,
    label: "Thông báo hệ thống",
  },
];

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === ROUTES.ADMIN_DASHBOARD) {
      return location.pathname === ROUTES.ADMIN_DASHBOARD;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="admin-layout">
      <AdminHeader />
      <div className="admin-layout-container">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <nav className="admin-sidebar-nav">
            {ADMIN_MENU.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.id}
                  className={`admin-menu-item ${active ? "admin-menu-item-active" : ""}`}
                  onClick={() => navigate(item.path)}
                >
                  <div className="admin-menu-icon">
                    <Icon />
                  </div>
                  <span className="admin-menu-label">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="admin-main-content">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
