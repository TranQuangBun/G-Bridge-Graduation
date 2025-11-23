import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../translet/LanguageContext";
import { Header, Footer } from "../../components";
import styles from "./DashboardLayout.module.css";
import {
  FaChartBar,
  FaClipboardList,
  FaUser,
  FaCog,
  FaBriefcase,
} from "react-icons/fa";

const INTERPRETER_MENU = [
  {
    id: "overview",
    path: "/dashboard",
    icon: FaChartBar,
    labelKey: "overview",
  },
  {
    id: "applications",
    path: "/dashboard/applications",
    icon: FaClipboardList,
    labelKey: "applications",
  },
  { id: "profile", path: "/profile", icon: FaUser, labelKey: "profile" },
  {
    id: "settings",
    path: "/dashboard/settings",
    icon: FaCog,
    labelKey: "settings",
  },
];

const CLIENT_MENU = [
  {
    id: "overview",
    path: "/dashboard",
    icon: FaChartBar,
    labelKey: "overview",
  },
  {
    id: "myJobs",
    path: "/dashboard/my-jobs",
    icon: FaBriefcase,
    labelKey: "myJobs",
  },
  {
    id: "jobApplications",
    path: "/dashboard/job-applications",
    icon: FaClipboardList,
    labelKey: "jobApplications",
  },
  {
    id: "profile",
    path: "/company/profile",
    icon: FaUser,
    labelKey: "profile",
  },
  {
    id: "settings",
    path: "/dashboard/settings",
    icon: FaCog,
    labelKey: "settings",
  },
];

export default function DashboardLayout({ children, title, subtitle }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const MENU = user?.role === "client" ? CLIENT_MENU : INTERPRETER_MENU;

  const isActive = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <Header />
      <div className={styles.dashboardLayout}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Dashboard</h2>
          </div>
          <nav className={styles.sidebarNav}>
            {MENU.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.id}
                  className={`${styles.menuItem} ${
                    active ? styles.menuItemActive : ""
                  }`}
                  onClick={() => navigate(item.path)}
                >
                  <div className={styles.menuIcon}>
                    <Icon />
                  </div>
                  <span className={styles.menuLabel}>
                    {t(`dashboard.menu.${item.labelKey}`)}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          {(title || subtitle) && (
            <header className={styles.contentHeader}>
              {title && <h1 className={styles.pageTitle}>{title}</h1>}
              {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
            </header>
          )}
          <div className={styles.contentBody}>{children}</div>
        </main>
      </div>
      <Footer />
    </>
  );
}
