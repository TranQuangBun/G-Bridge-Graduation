import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "../../translet/LanguageContext";
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
  FaRedo,
} from "react-icons/fa";
import "./AdminLayout.css";

const AdminLayout = ({ children }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const ADMIN_MENU = [
    {
      id: "dashboard",
      path: ROUTES.ADMIN_DASHBOARD,
      icon: FaChartBar,
      labelKey: "admin.sidebar.dashboard",
      label: "Dashboard",
    },
    {
      id: "certifications",
      path: ROUTES.ADMIN_CERTIFICATIONS,
      icon: FaCertificate,
      labelKey: "admin.sidebar.certifications",
      label: "Duyệt chứng chỉ",
    },
    {
      id: "organizations",
      path: ROUTES.ADMIN_ORGANIZATIONS,
      icon: FaBuilding,
      labelKey: "admin.sidebar.organizations",
      label: "Duyệt tổ chức",
    },
    {
      id: "jobs",
      path: ROUTES.ADMIN_JOB_MODERATION,
      icon: FaBriefcase,
      labelKey: "admin.sidebar.jobs",
      label: "Duyệt công việc",
    },
    {
      id: "users",
      path: ROUTES.ADMIN_USERS,
      icon: FaUsers,
      labelKey: "admin.sidebar.users",
      label: "Quản lý người dùng",
    },
    {
      id: "revenue",
      path: ROUTES.ADMIN_REVENUE,
      icon: FaDollarSign,
      labelKey: "admin.sidebar.revenue",
      label: "Quản lý doanh thu",
    },
    {
      id: "payment-recovery",
      path: ROUTES.ADMIN_PAYMENT_RECOVERY,
      icon: FaRedo,
      labelKey: "admin.sidebar.paymentRecovery",
      label: "Khôi phục thanh toán",
    },
    {
      id: "notifications",
      path: ROUTES.ADMIN_NOTIFICATIONS,
      icon: FaBell,
      labelKey: "admin.sidebar.notifications",
      label: "Thông báo hệ thống",
    },
  ];

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
              const label = t(item.labelKey) || item.label;
              return (
                <button
                  key={item.id}
                  className={`admin-menu-item ${active ? "admin-menu-item-active" : ""}`}
                  onClick={() => navigate(item.path)}
                >
                  <div className="admin-menu-icon">
                    <Icon />
                  </div>
                  <span className="admin-menu-label">{label}</span>
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
