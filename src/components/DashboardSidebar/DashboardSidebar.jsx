import React from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../translet/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { ROUTES } from "../../constants";
import styles from "./DashboardSidebar.module.css";

function DashboardSidebar({ activeMenu = "overview", onMenuChange }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if user is company/client role
  const isCompany = user?.role === "client" || user?.role === "company";

  const SIDEBAR_MENU = [
    { id: "overview", icon: "📊", labelKey: "overview" },
    {
      id: "applications",
      icon: "📋",
      label: isCompany ? "Job Applications" : null,
      labelKey: isCompany ? null : "applications",
    },
    {
      id: "favorites",
      icon: "❤️",
      label: isCompany ? "Saved Interpreters" : "Saved Jobs",
    },
    { id: "alerts", icon: "🔔", labelKey: "alerts" },
    {
      id: "profile",
      icon: isCompany ? "🏢" : "👤",
      label: isCompany ? "Company Profile" : null,
      labelKey: isCompany ? null : "profile",
    },
    { id: "settings", icon: "⚙️", labelKey: "settings" },
  ];

  const handleMenuClick = (menuId) => {
    if (onMenuChange) {
      onMenuChange(menuId);
    }

    // Navigate to appropriate route
    switch (menuId) {
      case "overview":
        navigate(ROUTES.DASHBOARD);
        break;
      case "applications":
        navigate(ROUTES.MY_APPLICATIONS);
        break;
      case "favorites":
        navigate(ROUTES.SAVED_JOBS);
        break;
      case "alerts":
        navigate(ROUTES.JOB_ALERTS);
        break;
      case "profile":
        if (isCompany) {
          navigate(ROUTES.COMPANY_PROFILE);
        } else {
          navigate(ROUTES.PROFILE);
        }
        break;
      case "settings":
        // Navigate to settings when implemented
        break;
      default:
        break;
    }
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h2 className={styles.sidebarTitle}>{t("dashboard.pageTitle")}</h2>
      </div>
      <nav className={styles.sidebarNav}>
        {SIDEBAR_MENU.map((item) => (
          <button
            key={item.id}
            className={`${styles.menuItem} ${
              activeMenu === item.id ? styles.menuItemActive : ""
            }`}
            onClick={() => handleMenuClick(item.id)}
          >
            <span className={styles.menuIcon}>{item.icon}</span>
            <span className={styles.menuLabel}>
              {item.label || t(`dashboard.navigation.${item.labelKey}`)}
            </span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default DashboardSidebar;
