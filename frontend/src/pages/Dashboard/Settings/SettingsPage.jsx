import React, { useState } from "react";
import styles from "./SettingsPage.module.css";
import { MainLayout } from "../../../layouts";
import { useLanguage } from "../../../translet/LanguageContext";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../constants";
import {
  FaChartBar,
  FaClipboardList,
  FaUser,
  FaCog,
  FaBookmark,
  FaEnvelope,
  FaBriefcase,
  FaGlobe,
  FaMoon,
  FaBell,
  FaLock,
  FaHistory,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "../../../contexts/AuthContext";

// Sidebar menu for Interpreter role
const INTERPRETER_SIDEBAR_MENU = [
  { id: "overview", icon: FaChartBar, labelKey: "overview", active: false },
  {
    id: "applications",
    icon: FaClipboardList,
    labelKey: "applications",
    active: false,
  },
  {
    id: "savedJobs",
    icon: FaBookmark,
    labelKey: "savedJobs",
    active: false,
  },
  {
    id: "notifications",
    icon: FaEnvelope,
    labelKey: "notifications",
    active: false,
  },
  { id: "profile", icon: FaUser, labelKey: "profile", active: false },
  { id: "settings", icon: FaCog, labelKey: "settings", active: true },
];

// Sidebar menu for Client/Company role
const CLIENT_SIDEBAR_MENU = [
  { id: "overview", icon: FaChartBar, labelKey: "overview", active: false },
  { id: "myJobs", icon: FaBriefcase, labelKey: "myJobs", active: false },
  {
    id: "jobApplications",
    icon: FaClipboardList,
    labelKey: "jobApplications",
    active: false,
  },
  {
    id: "savedInterpreters",
    icon: FaBookmark,
    labelKey: "savedInterpreters",
    active: false,
  },
  {
    id: "notifications",
    icon: FaEnvelope,
    labelKey: "notifications",
    active: false,
  },
  { id: "profile", icon: FaUser, labelKey: "profile", active: false },
  { id: "settings", icon: FaCog, labelKey: "settings", active: true },
];

function SettingsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("settings");

  // Get sidebar menu based on user role
  const SIDEBAR_MENU =
    user?.role === "client" ? CLIENT_SIDEBAR_MENU : INTERPRETER_SIDEBAR_MENU;

  // Preferences state
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [themeMode, setThemeMode] = useState("light");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  // Security state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // App settings state
  const [savedJobsCount] = useState(0);

  return (
    <MainLayout>
      <div className={styles.dashboardRoot}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>{t("dashboard.pageTitle")}</h2>
          </div>
          <nav className={styles.sidebarNav}>
            {SIDEBAR_MENU.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  className={`${styles.menuItem} ${
                    activeMenu === item.id ? styles.menuItemActive : ""
                  }`}
                  onClick={() => {
                    setActiveMenu(item.id);
                    if (item.id === "overview") {
                      navigate(ROUTES.DASHBOARD);
                    } else if (item.id === "applications") {
                      navigate(ROUTES.MY_APPLICATIONS);
                    } else if (item.id === "savedJobs") {
                      navigate(ROUTES.SAVED_JOBS);
                    } else if (item.id === "myJobs") {
                      navigate(ROUTES.MY_JOBS);
                    } else if (item.id === "jobApplications") {
                      navigate(ROUTES.MY_APPLICATIONS);
                    } else if (item.id === "savedInterpreters") {
                      navigate(ROUTES.SAVED_INTERPRETERS);
                    } else if (item.id === "notifications") {
                      navigate(ROUTES.DASHBOARD + "?tab=notifications");
                    } else if (item.id === "profile") {
                      navigate(ROUTES.PROFILE);
                    } else if (item.id === "settings") {
                      // Already on settings page
                    }
                  }}
                >
                  <span className={styles.menuIcon}>
                    <IconComponent />
                  </span>
                  <span className={styles.menuLabel}>
                    {t(`dashboard.navigation.${item.labelKey}`)}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          {/* Header */}
          <header className={styles.contentHeader}>
            <h1 className={styles.greeting}>
              {t("settings.title") || "Settings"}
            </h1>
            <p className={styles.subGreeting}>
              {t("settings.subtitle") ||
                "Manage your account preferences and settings"}
            </p>
          </header>

          <div className={styles.settingsContainer}>
            {/* Account Preferences Card */}
            <div className={styles.settingsCard}>
              <div className={styles.settingsCardHeader}>
                <FaCog className={styles.settingsHeaderIcon} />
                <h2>
                  {t("settings.preferences.title") || "Account Preferences"}
                </h2>
              </div>
              <div className={styles.settingsCardBody}>
                {/* Language Selector */}
                <div className={styles.preferenceItem}>
                  <div className={styles.preferenceInfo}>
                    <FaGlobe className={styles.preferenceIcon} />
                    <div>
                      <h3>
                        {t("settings.preferences.language") || "Language"}
                      </h3>
                      <p>
                        {t("settings.preferences.languageDescription") ||
                          "Choose your preferred language"}
                      </p>
                    </div>
                  </div>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className={styles.selectInput}
                  >
                    <option value="en">English</option>
                    <option value="vi">Tiếng Việt</option>
                    <option value="ko">한국어</option>
                  </select>
                </div>

                {/* Theme Toggle */}
                <div className={styles.preferenceItem}>
                  <div className={styles.preferenceInfo}>
                    <FaMoon className={styles.preferenceIcon} />
                    <div>
                      <h3>{t("settings.preferences.theme") || "Dark Mode"}</h3>
                      <p>
                        {t("settings.preferences.themeDescription") ||
                          "Toggle dark mode on or off"}
                      </p>
                    </div>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={themeMode === "dark"}
                      onChange={(e) =>
                        setThemeMode(e.target.checked ? "dark" : "light")
                      }
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>

                {/* Email Notifications */}
                <div className={styles.preferenceItem}>
                  <div className={styles.preferenceInfo}>
                    <FaEnvelope className={styles.preferenceIcon} />
                    <div>
                      <h3>
                        {t("settings.preferences.emailNotifications") ||
                          "Email Notifications"}
                      </h3>
                      <p>
                        {t("settings.preferences.emailDescription") ||
                          "Receive updates via email"}
                      </p>
                    </div>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>

                {/* Push Notifications */}
                <div className={styles.preferenceItem}>
                  <div className={styles.preferenceInfo}>
                    <FaBell className={styles.preferenceIcon} />
                    <div>
                      <h3>
                        {t("settings.preferences.pushNotifications") ||
                          "Push Notifications"}
                      </h3>
                      <p>
                        {t("settings.preferences.pushDescription") ||
                          "Receive push notifications"}
                      </p>
                    </div>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={pushNotifications}
                      onChange={(e) => setPushNotifications(e.target.checked)}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>

                {/* SMS Notifications */}
                <div className={styles.preferenceItem}>
                  <div className={styles.preferenceInfo}>
                    <FaEnvelope className={styles.preferenceIcon} />
                    <div>
                      <h3>
                        {t("settings.preferences.smsNotifications") ||
                          "SMS Notifications"}
                      </h3>
                      <p>
                        {t("settings.preferences.smsDescription") ||
                          "Receive important updates via SMS"}
                      </p>
                    </div>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={smsNotifications}
                      onChange={(e) => setSmsNotifications(e.target.checked)}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Security Card */}
            <div className={styles.settingsCard}>
              <div className={styles.settingsCardHeader}>
                <FaLock className={styles.settingsHeaderIcon} />
                <h2>{t("settings.security.title") || "Security"}</h2>
              </div>
              <div className={styles.settingsCardBody}>
                <div className={styles.securityItem}>
                  <div className={styles.securityItemContent}>
                    <div>
                      <h3>
                        {t("settings.security.changePassword") ||
                          "Change Password"}
                      </h3>
                      <p>
                        {t("settings.security.passwordDescription") ||
                          "Update your password regularly"}
                      </p>
                    </div>
                    <button
                      className={styles.secondaryButton}
                      onClick={() => setShowPasswordModal(true)}
                    >
                      {t("settings.security.change") || "Change"}
                    </button>
                  </div>
                </div>

                <div className={styles.securityItem}>
                  <div className={styles.securityItemContent}>
                    <div className={styles.securityItemInfo}>
                      <FaHistory className={styles.preferenceIcon} />
                      <div>
                        <h3>
                          {t("settings.security.loginActivity") ||
                            "Recent Login Activity"}
                        </h3>
                      </div>
                    </div>
                    <ul className={styles.activityList}>
                      <li>
                        <strong>Windows PC</strong> - Ho Chi Minh City, Vietnam
                        <br />
                        <small>Today at 10:30 AM</small>
                      </li>
                      <li>
                        <strong>iPhone 12</strong> - Hanoi, Vietnam
                        <br />
                        <small>Yesterday at 3:45 PM</small>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* App Settings Card */}
            <div className={styles.settingsCard}>
              <div className={styles.settingsCardHeader}>
                <FaCog className={styles.settingsHeaderIcon} />
                <h2>{t("settings.app.title") || "App Settings"}</h2>
              </div>
              <div className={styles.settingsCardBody}>
                <div className={styles.appItem}>
                  <div>
                    <h3>
                      {t("settings.app.savedJobs") || "Saved Jobs"}:{" "}
                      {savedJobsCount}
                    </h3>
                    <p>
                      {t("settings.app.savedJobsDescription") ||
                        "Manage your saved jobs"}
                    </p>
                  </div>
                </div>
                <div className={styles.appItem}>
                  <div>
                    <h3>{t("settings.app.clearCache") || "Clear Cache"}</h3>
                    <p>
                      {t("settings.app.cacheDescription") ||
                        "Free up storage space"}
                    </p>
                  </div>
                  <button
                    className={styles.secondaryButton}
                    onClick={() => {
                      toast.success(
                        t("settings.app.cacheCleared") || "Cache cleared"
                      );
                    }}
                  >
                    {t("settings.app.clear") || "Clear"}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
              <div className={styles.modalOverlay}>
                <div className={styles.modal}>
                  <div className={styles.modalHeader}>
                    <h2>
                      {t("settings.security.changePassword") ||
                        "Change Password"}
                    </h2>
                    <button
                      className={styles.modalClose}
                      onClick={() => {
                        setShowPasswordModal(false);
                        setPasswordData({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div className={styles.modalBody}>
                    <div className={styles.formGroup}>
                      <label>
                        {t("settings.security.currentPassword") ||
                          "Current Password"}
                      </label>
                      <div className={styles.passwordInputGroup}>
                        <input
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              currentPassword: e.target.value,
                            })
                          }
                          className={styles.formInput}
                        />
                        <button
                          type="button"
                          className={styles.passwordToggle}
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              current: !showPasswords.current,
                            })
                          }
                        >
                          {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>
                        {t("settings.security.newPassword") || "New Password"}
                      </label>
                      <div className={styles.passwordInputGroup}>
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value,
                            })
                          }
                          className={styles.formInput}
                        />
                        <button
                          type="button"
                          className={styles.passwordToggle}
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              new: !showPasswords.new,
                            })
                          }
                        >
                          {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>
                        {t("settings.security.confirmPassword") ||
                          "Confirm New Password"}
                      </label>
                      <div className={styles.passwordInputGroup}>
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirmPassword: e.target.value,
                            })
                          }
                          className={styles.formInput}
                        />
                        <button
                          type="button"
                          className={styles.passwordToggle}
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              confirm: !showPasswords.confirm,
                            })
                          }
                        >
                          {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className={styles.modalFooter}>
                    <button
                      className={styles.cancelButton}
                      onClick={() => {
                        setShowPasswordModal(false);
                        setPasswordData({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                      }}
                    >
                      {t("common.cancel") || "Cancel"}
                    </button>
                    <button
                      className={styles.saveButton}
                      onClick={() => {
                        if (
                          passwordData.newPassword !==
                          passwordData.confirmPassword
                        ) {
                          toast.error(
                            t("settings.security.passwordMismatch") ||
                              "Passwords don't match"
                          );
                          return;
                        }
                        toast.success(
                          t("settings.security.passwordChanged") ||
                            "Password changed successfully"
                        );
                        setShowPasswordModal(false);
                        setPasswordData({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                      }}
                    >
                      {t("settings.security.changePassword") ||
                        "Change Password"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </MainLayout>
  );
}

export default SettingsPage;
