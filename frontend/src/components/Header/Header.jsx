import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import "./Header.css";
import NotificationDropdown from "../NotificationDropdown/NotificationDropdown";
import VNFlag from "../../assets/images/languages/VN.png";
import USFlag from "../../assets/images/languages/US.png";
import { useLanguage } from "../../translet/LanguageContext";
import { FaEnvelope } from "react-icons/fa";
import messageService from "../../services/messageService";

const Header = () => {
  const { lang, setLang, t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMessageDropdownOpen, setIsMessageDropdownOpen] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadConversations, setUnreadConversations] = useState([]);
  const userMenuRef = useRef(null);
  const messageDropdownRef = useRef(null);

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
      if (
        messageDropdownRef.current &&
        !messageDropdownRef.current.contains(event.target)
      ) {
        setIsMessageDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load unread message count and conversations
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadUnreadData = async () => {
      try {
        const [countResponse, conversationsResponse] = await Promise.all([
          messageService.getUnreadCount(),
          messageService.getConversations(false, false), // Not archived, not deleted
        ]);

        setUnreadMessageCount(countResponse.data?.unreadCount || 0);

        // Filter conversations with unread messages
        const conversations = conversationsResponse.data || [];

        const unread = conversations.filter((conv) => {
          let unreadCount = 0;

          // Check if conversation has otherParticipant structure (transformed)
          if (conv.otherParticipant) {
            unreadCount = Number(conv.unreadCount) || 0;
          } else {
            // Fallback to raw structure
            const isParticipant1 =
              conv.participant1Id === parseInt(user?.id || user?.sub);
            const rawUnread1 = conv.participant1UnreadCount;
            const rawUnread2 = conv.participant2UnreadCount;
            unreadCount = isParticipant1
              ? Number(rawUnread1) || 0
              : Number(rawUnread2) || 0;
          }

          const hasUnread = unreadCount > 0;
          return hasUnread;
        });


        // If no unread but we have unread count > 0, show recent conversations with messages
        let conversationsToShow = unread;
        if (unread.length === 0 && countResponse.data?.unreadCount > 0) {
          conversationsToShow = conversations
            .filter((conv) => conv.lastMessage) // Has at least one message
            .sort((a, b) => {
              const dateA = new Date(a.lastMessageAt || 0).getTime();
              const dateB = new Date(b.lastMessageAt || 0).getTime();
              return dateB - dateA;
            })
            .slice(0, 5);
        }

        // Sort by lastMessageAt (most recent first) and limit to 5
        const sorted = conversationsToShow
          .sort((a, b) => {
            const dateA = new Date(a.lastMessageAt || 0).getTime();
            const dateB = new Date(b.lastMessageAt || 0).getTime();
            return dateB - dateA;
          })
          .slice(0, 5);

        setUnreadConversations(sorted);
      } catch (error) {
        console.error("Error loading unread message data:", error);
      }
    };

    loadUnreadData();

    // Poll for updates every 10 seconds
    const interval = setInterval(loadUnreadData, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  const toggleMobileMenu = () => setIsMobileMenuOpen((o) => !o);
  const toggleLanguage = () => setLang(lang === "vi" ? "en" : "vi");
  const toggleUserMenu = () => setIsUserMenuOpen((prev) => !prev);
  const toggleMessageDropdown = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const willOpen = !isMessageDropdownOpen;
    setIsMessageDropdownOpen(willOpen);

    // Reload conversations when opening dropdown
    if (willOpen && isAuthenticated) {
      try {
        const conversationsResponse = await messageService.getConversations(
          false,
          false
        );
        const conversations = conversationsResponse.data || [];

        console.log(
          "All conversations when opening dropdown:",
          conversations
        );

        // Filter conversations with unread messages
        const unread = conversations.filter((conv) => {
          let unreadCount = 0;

          // Check if conversation has otherParticipant structure (transformed)
          if (conv.otherParticipant) {
            unreadCount = Number(conv.unreadCount) || 0;
          } else {
            // Fallback to raw structure
            const isParticipant1 =
              conv.participant1Id === parseInt(user?.id || user?.sub);
            const rawUnread1 = conv.participant1UnreadCount;
            const rawUnread2 = conv.participant2UnreadCount;
            unreadCount = isParticipant1
              ? Number(rawUnread1) || 0
              : Number(rawUnread2) || 0;
          }

          const hasUnread = unreadCount > 0;
          return hasUnread;
        });


        // If no unread but we have unread count > 0, show recent conversations with messages
        let conversationsToShow = unread;
        if (unread.length === 0 && unreadMessageCount > 0) {
          conversationsToShow = conversations
            .filter((conv) => conv.lastMessage) // Has at least one message
            .sort((a, b) => {
              const dateA = new Date(a.lastMessageAt || 0).getTime();
              const dateB = new Date(b.lastMessageAt || 0).getTime();
              return dateB - dateA;
            })
            .slice(0, 5);
        }

        // Sort by lastMessageAt (most recent first) and limit to 5
        const sorted = conversationsToShow
          .sort((a, b) => {
            const dateA = new Date(a.lastMessageAt || 0).getTime();
            const dateB = new Date(b.lastMessageAt || 0).getTime();
            return dateB - dateA;
          })
          .slice(0, 5);

        setUnreadConversations(sorted);
      } catch (error) {
        console.error("Error loading conversations for dropdown:", error);
      }
    }
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate(ROUTES.HOME);
  };

  const handleProfileClick = () => {
    setIsUserMenuOpen(false);
    navigate(ROUTES.PROFILE);
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

              {/* Show Find Interpreter for Company, Find Job for Interpreter, both for non-logged-in users */}
              {!isAuthenticated ? (
                <>
                  <Link
                    to={ROUTES.FIND_JOB}
                    className={`nav-item ${
                      isActiveRoute(ROUTES.FIND_JOB) ? "active" : ""
                    }`}
                  >
                    <span>{t("common.findJob")}</span>
                  </Link>
                  <Link
                    to={ROUTES.FIND_INTERPRETER}
                    className={`nav-item ${
                      isActiveRoute(ROUTES.FIND_INTERPRETER) ? "active" : ""
                    }`}
                  >
                    <span>{t("common.findInterpreter")}</span>
                  </Link>
                </>
              ) : user?.role === "client" ? (
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
                  lang === "vi" 
                    ? t("common.switchToEnglish") || "Switch to English"
                    : t("common.switchToVietnamese") || "Chuyển sang Tiếng Việt"
                }
              >
                <img
                  src={lang === "vi" ? VNFlag : USFlag}
                  alt={lang === "vi" ? t("common.vietnamese") || "Vietnamese" : t("common.english") || "English"}
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

                  {/* Messages Icon with Dropdown */}
                  <div
                    className="message-dropdown-container"
                    ref={messageDropdownRef}
                  >
                    <button
                      onClick={toggleMessageDropdown}
                      className={`message-btn ${
                        isActiveRoute(ROUTES.MESSAGES) ? "active" : ""
                      } ${isMessageDropdownOpen ? "open" : ""}`}
                      title={t("common.messages") || "Messages"}
                    >
                      <FaEnvelope />
                      {unreadMessageCount > 0 && (
                        <span className="message-badge">
                          {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                        </span>
                      )}
                    </button>

                    {/* Message Dropdown Preview */}
                    {isMessageDropdownOpen && (
                      <div className="message-dropdown">
                        <div className="message-dropdown-header">
                          <h4>{t("common.messages") || "Messages"}</h4>
                          <Link
                            to={ROUTES.MESSAGES}
                            onClick={() => setIsMessageDropdownOpen(false)}
                            className="view-all-link"
                          >
                            {t("common.viewAll") || "View All"}
                          </Link>
                        </div>
                        <div className="message-dropdown-content">
                          {unreadConversations.length === 0 ? (
                            <div className="message-dropdown-empty">
                              <FaEnvelope />
                              <p>
                                {t("common.noUnreadMessages") || "No unread messages"}
                              </p>
                            </div>
                          ) : (
                            unreadConversations.map((conv) => {
                              // Handle both transformed and raw conversation structures
                              let otherParticipant, unreadCount;

                              if (conv.otherParticipant) {
                                // Transformed structure (from API)
                                otherParticipant = conv.otherParticipant;
                                unreadCount = Number(conv.unreadCount) || 0;
                              } else {
                                // Raw structure (fallback)
                                const isParticipant1 =
                                  conv.participant1Id ===
                                  parseInt(user?.id || user?.sub);
                                unreadCount = isParticipant1
                                  ? Number(conv.participant1UnreadCount) || 0
                                  : Number(conv.participant2UnreadCount) || 0;
                                otherParticipant = isParticipant1
                                  ? conv.participant2
                                  : conv.participant1;
                              }

                              console.log(
                                `Rendering conversation ${conv.id}:`,
                                {
                                  otherParticipant,
                                  unreadCount,
                                  lastMessage: conv.lastMessage,
                                }
                              );

                              return (
                                <Link
                                  key={conv.id}
                                  to={`${ROUTES.MESSAGES}?conversation=${conv.id}`}
                                  onClick={() =>
                                    setIsMessageDropdownOpen(false)
                                  }
                                  className="message-dropdown-item"
                                >
                                  <div className="message-item-avatar">
                                    {otherParticipant?.avatar ? (
                                      <img
                                        src={
                                          otherParticipant.avatar.startsWith(
                                            "http"
                                          )
                                            ? otherParticipant.avatar
                                            : `http://localhost:4000${otherParticipant.avatar}`
                                        }
                                        alt={otherParticipant.fullName}
                                      />
                                    ) : (
                                      <span>
                                        {otherParticipant?.fullName
                                          ?.charAt(0)
                                          ?.toUpperCase() ||
                                          otherParticipant?.email
                                            ?.charAt(0)
                                            ?.toUpperCase() ||
                                          "?"}
                                      </span>
                                    )}
                                  </div>
                                  <div className="message-item-content">
                                    <div className="message-item-header">
                                      <span className="message-item-name">
                                        {otherParticipant?.fullName ||
                                          otherParticipant?.email ||
                                          "User"}
                                      </span>
                                      {unreadCount > 0 && (
                                        <span className="message-item-badge">
                                          {unreadCount > 99
                                            ? "99+"
                                            : unreadCount}
                                        </span>
                                      )}
                                    </div>
                                    <p className="message-item-preview">
                                      {conv.lastMessage?.content
                                        ? conv.lastMessage.content.length > 50
                                          ? conv.lastMessage.content.substring(
                                              0,
                                              50
                                            ) + "..."
                                          : conv.lastMessage.content
                                        : t("common.noMessage") || "No message"}
                                    </p>
                                    {conv.lastMessageAt && (
                                      <span className="message-item-time">
                                        {new Date(
                                          conv.lastMessageAt
                                        ).toLocaleTimeString("vi-VN", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    )}
                                  </div>
                                </Link>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

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
                          {user?.fullName?.charAt(0)?.toUpperCase() ||
                            user?.email?.charAt(0)?.toUpperCase() ||
                            "U"}
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
                                {user?.fullName?.charAt(0)?.toUpperCase() ||
                                  user?.email?.charAt(0)?.toUpperCase() ||
                                  "U"}
                              </div>
                            )}
                            <div className="user-details">
                              <p className="user-name">
                                {user?.fullName || "User"}
                              </p>
                              <p className="user-email">{user?.email}</p>
                              <span className="user-role-badge">
                                {user?.role === "client"
                                  ? t("header.roles.client") || "Client"
                                  : user?.role === "interpreter"
                                  ? t("header.roles.interpreter") ||
                                    "Interpreter"
                                  : user?.role === "admin"
                                  ? t("header.roles.admin") || "Admin"
                                  : user?.role}
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
                              navigate(ROUTES.DASHBOARD + "?tab=notifications");
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
                              {t("common.myProfile") || "My Profile"}
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
                          {/* Interpreter specific menu items */}
                          {user?.role === "interpreter" && (
                            <>
                              <button
                                className="dropdown-item"
                                onClick={() => {
                                  setIsUserMenuOpen(false);
                                  navigate(ROUTES.MY_APPLICATIONS);
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
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                  <polyline points="14 2 14 8 20 8"></polyline>
                                  <line x1="16" y1="13" x2="8" y2="13"></line>
                                  <line x1="16" y1="17" x2="8" y2="17"></line>
                                  <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                                <span>
                                  {t("common.myApplications") || "My Applications"}
                                </span>
                              </button>
                              <button
                                className="dropdown-item"
                                onClick={() => {
                                  setIsUserMenuOpen(false);
                                  navigate(ROUTES.SAVED_JOBS);
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
                                  {t("common.savedJobs") || "Saved Jobs"}
                                </span>
                              </button>
                            </>
                          )}
                          {/* Client specific menu items */}
                          {user?.role === "client" && (
                            <>
                              <button
                                className="dropdown-item"
                                onClick={() => {
                                  setIsUserMenuOpen(false);
                                  navigate(ROUTES.MY_JOBS);
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
                                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                </svg>
                                <span>
                                  {t("common.myJobs") || "My Jobs"}
                                </span>
                              </button>
                              <button
                                className="dropdown-item"
                                onClick={() => {
                                  setIsUserMenuOpen(false);
                                  navigate(ROUTES.JOB_APPLICATIONS);
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
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                  <polyline points="14 2 14 8 20 8"></polyline>
                                  <line x1="16" y1="13" x2="8" y2="13"></line>
                                  <line x1="16" y1="17" x2="8" y2="17"></line>
                                </svg>
                                <span>
                                  {t("common.jobApplications") || "Job Applications"}
                                </span>
                              </button>
                              <button
                                className="dropdown-item"
                                onClick={() => {
                                  setIsUserMenuOpen(false);
                                  navigate(ROUTES.SAVED_INTERPRETERS);
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
                                  {t("common.savedInterpreters") || "Saved Interpreters"}
                                </span>
                              </button>
                            </>
                          )}
                          {/* Admin specific menu items */}
                          {user?.role === "admin" && (
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                navigate(ROUTES.ADMIN_DASHBOARD);
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
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                              </svg>
                              <span>
                                {t("common.adminDashboard") || "Admin Dashboard"}
                              </span>
                            </button>
                          )}
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              navigate(ROUTES.SETTINGS);
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
                              {t("common.settings") || "Settings"}
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
                              {t("common.logout") || "Logout"}
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
                  lang === "vi" 
                    ? t("common.switchToEnglish") || "Switch to English"
                    : t("common.switchToVietnamese") || "Chuyển sang Tiếng Việt"
                }
              >
                <img
                  src={lang === "vi" ? VNFlag : USFlag}
                  alt={lang === "vi" ? t("common.vietnamese") || "Vietnamese" : t("common.english") || "English"}
                  className="mobile-flag-image"
                />
                {lang === "vi" ? t("common.vietnamese") || "Tiếng Việt" : t("common.english") || "English"}
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
              {!isAuthenticated ? (
                <>
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
                    to={ROUTES.FIND_INTERPRETER}
                    className={`mobile-nav-item ${
                      isActiveRoute(ROUTES.FIND_INTERPRETER) ? "active" : ""
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t("common.findInterpreter")}
                  </Link>
                </>
              ) : (
                <>
                  {user?.role === "client" ? (
                    <Link
                      to={ROUTES.FIND_INTERPRETER}
                      className={`mobile-nav-item ${
                        isActiveRoute(ROUTES.FIND_INTERPRETER) ? "active" : ""
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t("common.findInterpreter")}
                    </Link>
                  ) : (
                    <Link
                      to={ROUTES.FIND_JOB}
                      className={`mobile-nav-item ${
                        isActiveRoute(ROUTES.FIND_JOB) ? "active" : ""
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t("common.findJob")}
                    </Link>
                  )}
                  <Link
                    to={ROUTES.DASHBOARD}
                    className={`mobile-nav-item ${
                      isActiveRoute(ROUTES.DASHBOARD) ? "active" : ""
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t("common.dashboard")}
                  </Link>
                </>
              )}
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
                        {user?.fullName?.charAt(0)?.toUpperCase() ||
                          user?.email?.charAt(0)?.toUpperCase() ||
                          "U"}
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
                      {t("common.profile") || "Profile"}
                    </button>
                    <button
                      className="mobile-menu-action"
                      onClick={() => {
                        navigate(ROUTES.MESSAGES);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <FaEnvelope />
                      <span>
                        {t("common.messages") || "Messages"}
                        {unreadMessageCount > 0 && (
                          <span className="mobile-message-badge">
                            {unreadMessageCount > 99
                              ? "99+"
                              : unreadMessageCount}
                          </span>
                        )}
                      </span>
                    </button>
                    <button
                      className="mobile-menu-action"
                      onClick={() => {
                        navigate(ROUTES.DASHBOARD + "?tab=notifications");
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
                        navigate(ROUTES.SETTINGS);
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
                      {t("common.settings") || "Settings"}
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
                      {t("common.logout") || "Logout"}
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
