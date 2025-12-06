import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../hooks/useToast";
import { ToastContainer } from "../../components/Toast";
import { ROUTES, LANGUAGES } from "../../constants";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaGoogle,
  FaFacebook,
  FaUser,
  FaBuilding,
  FaBriefcase,
} from "react-icons/fa";
import VNFlag from "../../assets/images/languages/VN.png";
import USFlag from "../../assets/images/languages/US.png";
import "./LoginPage.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState("login"); // "login" or "signup"

  // Login form state
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginErrors, setLoginErrors] = useState({});
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Register form state
  const [registerData, setRegisterData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    companyName: "",
    companyType: "corporation",
  });
  const [registerErrors, setRegisterErrors] = useState({});
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const { toasts, showSuccess, showError, removeToast } = useToast();

  // Language state
  const [language, setLanguage] = useState(
    () => localStorage.getItem("language") || LANGUAGES.VI
  );

  const t = {
    vi: {
      // Tabs
      loginTab: "Đăng nhập",
      signupTab: "Đăng ký",

      // Login
      loginTitle: "Chào mừng trở lại",
      loginSubtitle: "Đăng nhập để tiếp tục sử dụng dịch vụ",
      email: "Email",
      emailPlaceholder: "Nhập email của bạn",
      password: "Mật khẩu",
      passwordPlaceholder: "Nhập mật khẩu",
      remember: "Ghi nhớ đăng nhập",
      forgot: "Quên mật khẩu?",
      loginButton: "Đăng nhập",
      loggingIn: "Đang đăng nhập...",

      // Register
      signupTitle: "Tạo tài khoản mới",
      signupSubtitle: "Bắt đầu kết nối với thế giới",
      chooseRole: "Chọn vai trò của bạn",
      interpreter: "Phiên dịch viên",
      interpreterDesc: "Tìm kiếm công việc phiên dịch",
      company: "Công ty",
      companyDesc: "Tuyển dụng phiên dịch viên",
      fullName: "Họ và tên",
      fullNamePlaceholder: "Nhập họ tên đầy đủ",
      companyName: "Tên công ty",
      companyNamePlaceholder: "Nhập tên công ty",
      companyType: "Loại hình công ty",
      corporation: "Công ty",
      startup: "Startup",
      nonprofit: "Phi lợi nhuận",
      government: "Chính phủ",
      healthcare: "Y tế",
      education: "Giáo dục",
      other: "Khác",
      confirmPassword: "Xác nhận mật khẩu",
      confirmPasswordPlaceholder: "Nhập lại mật khẩu",
      signupButton: "Tạo tài khoản",
      creatingAccount: "Đang tạo tài khoản...",

      // Common
      socialOr: "Hoặc tiếp tục với",

      // Validation
      emailRequired: "Vui lòng nhập email",
      emailInvalid: "Email không hợp lệ",
      passwordRequired: "Vui lòng nhập mật khẩu",
      passwordLength: "Mật khẩu phải có ít nhất 6 ký tự",
      passwordMatch: "Mật khẩu không khớp",
      fullNameRequired: "Vui lòng nhập họ tên",
      roleRequired: "Vui lòng chọn vai trò",
      companyNameRequired: "Vui lòng nhập tên công ty",
      confirmPasswordRequired: "Vui lòng xác nhận mật khẩu",

      // Messages
      loginSuccess: "Đăng nhập thành công!",
      loginError: "Đăng nhập thất bại. Vui lòng kiểm tra lại.",
      registerSuccess: "Đăng ký thành công!",
      registerError: "Đăng ký thất bại. Vui lòng thử lại.",

      showPassword: "Hiện mật khẩu",
      hidePassword: "Ẩn mật khẩu",
      switchHint: "Switch to English",
    },
    en: {
      // Tabs
      loginTab: "Login",
      signupTab: "Sign Up",

      // Login
      loginTitle: "Welcome back",
      loginSubtitle: "Login to continue using our services",
      email: "Email",
      emailPlaceholder: "Enter your email",
      password: "Password",
      passwordPlaceholder: "Enter your password",
      remember: "Remember me",
      forgot: "Forgot password?",
      loginButton: "Login",
      loggingIn: "Logging in...",

      // Register
      signupTitle: "Create new account",
      signupSubtitle: "Start connecting with the world",
      chooseRole: "Choose your role",
      interpreter: "Interpreter",
      interpreterDesc: "Find interpretation jobs",
      company: "Company",
      companyDesc: "Hire interpreters",
      fullName: "Full Name",
      fullNamePlaceholder: "Enter your full name",
      companyName: "Company Name",
      companyNamePlaceholder: "Enter company name",
      companyType: "Company Type",
      corporation: "Corporation",
      startup: "Startup",
      nonprofit: "Non-profit",
      government: "Government",
      healthcare: "Healthcare",
      education: "Education",
      other: "Other",
      confirmPassword: "Confirm Password",
      confirmPasswordPlaceholder: "Re-enter password",
      signupButton: "Create Account",
      creatingAccount: "Creating account...",

      // Common
      socialOr: "Or continue with",

      // Validation
      emailRequired: "Please enter email",
      emailInvalid: "Invalid email",
      passwordRequired: "Please enter password",
      passwordLength: "Password must be at least 6 characters",
      passwordMatch: "Passwords do not match",
      fullNameRequired: "Please enter full name",
      roleRequired: "Please choose a role",
      companyNameRequired: "Please enter company name",
      confirmPasswordRequired: "Please confirm password",

      // Messages
      loginSuccess: "Login successful!",
      loginError: "Login failed. Please check your credentials.",
      registerSuccess: "Registration successful!",
      registerError: "Registration failed. Please try again.",

      showPassword: "Show password",
      hidePassword: "Hide password",
      switchHint: "Switch to Tiếng Việt",
    },
  }[language];

  const handleLanguageSwitch = () => {
    const newLang = language === LANGUAGES.VI ? LANGUAGES.EN : LANGUAGES.VI;
    setLanguage(newLang);
    localStorage.setItem("language", newLang);
  };

  // Login handlers
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
    if (loginErrors[name]) {
      setLoginErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Register handlers
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData((prev) => ({ ...prev, [name]: value }));
    if (registerErrors[name]) {
      setRegisterErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleRoleSelect = (role) => {
    setRegisterData((prev) => ({ ...prev, role }));
    if (registerErrors.role) {
      setRegisterErrors((prev) => ({ ...prev, role: "" }));
    }
  };

  // Validation
  const validateLogin = () => {
    const newErrors = {};
    if (!loginData.email.trim()) {
      newErrors.email = t.emailRequired;
    } else if (!/\S+@\S+\.\S+/.test(loginData.email)) {
      newErrors.email = t.emailInvalid;
    }
    if (!loginData.password) {
      newErrors.password = t.passwordRequired;
    }
    return newErrors;
  };

  const validateRegister = () => {
    const newErrors = {};
    if (!registerData.fullName.trim()) {
      newErrors.fullName = t.fullNameRequired;
    }
    if (!registerData.role) {
      newErrors.role = t.roleRequired;
    }
    if (registerData.role === "client" && !registerData.companyName.trim()) {
      newErrors.companyName = t.companyNameRequired;
    }
    if (!registerData.email.trim()) {
      newErrors.email = t.emailRequired;
    } else if (!/\S+@\S+\.\S+/.test(registerData.email)) {
      newErrors.email = t.emailInvalid;
    }
    if (!registerData.password) {
      newErrors.password = t.passwordRequired;
    } else if (registerData.password.length < 6) {
      newErrors.password = t.passwordLength;
    }
    if (!registerData.confirmPassword) {
      newErrors.confirmPassword = t.confirmPasswordRequired;
    } else if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = t.passwordMatch;
    }
    return newErrors;
  };

  // Submit handlers
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateLogin();

    if (Object.keys(newErrors).length > 0) {
      setLoginErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(loginData.email, loginData.password);

      if (result.success) {
        showSuccess(t.loginSuccess);
        setTimeout(() => {
          navigate(ROUTES.HOME);
        }, 500);
      } else {
        showError(result.error || t.loginError);
      }
    } catch (error) {
      console.error("Login error:", error);
      showError(t.loginError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateRegister();

    if (Object.keys(newErrors).length > 0) {
      setRegisterErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const registerPayload = {
        fullName: registerData.fullName,
        email: registerData.email,
        password: registerData.password,
        role: registerData.role,
      };

      if (registerData.role === "client") {
        registerPayload.companyName = registerData.companyName;
        registerPayload.companyType = registerData.companyType;
      }

      const result = await register(registerPayload);

      if (result.success) {
        showSuccess(t.registerSuccess);
        setTimeout(() => {
          navigate(ROUTES.HOME);
        }, 500);
      } else {
        showError(result.error || t.registerError);
      }
    } catch (error) {
      console.error("Registration error:", error);
      showError(t.registerError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modern-auth-page">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Background */}
      <div className="modern-auth-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Auth Container */}
      <div className="modern-auth-container">
        <div className="modern-auth-card">
          {/* Header with Logo and Language */}
          <div className="modern-auth-header">
            <Link to={ROUTES.HOME} className="logo-section">
              <div className="logo-circle">
                <span className="logo-letter">G</span>
              </div>
              <span className="logo-name">G-Bridge</span>
            </Link>

            <button
              type="button"
              className="language-switch-btn"
              onClick={handleLanguageSwitch}
              title={t.switchHint}
            >
              <img
                src={language === LANGUAGES.VI ? VNFlag : USFlag}
                alt={language === LANGUAGES.VI ? "Vietnamese" : "English"}
                className="flag-icon"
              />
              <span className="lang-code">{language.toUpperCase()}</span>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              type="button"
              className={`tab-btn ${activeTab === "login" ? "active" : ""}`}
              onClick={() => setActiveTab("login")}
            >
              {t.loginTab}
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === "signup" ? "active" : ""}`}
              onClick={() => setActiveTab("signup")}
            >
              {t.signupTab}
            </button>
            <div
              className={`tab-indicator ${
                activeTab === "signup" ? "right" : ""
              }`}
            ></div>
          </div>

          {/* Login Form */}
          {activeTab === "login" && (
            <div className="auth-form-container">
              <div className="form-title-section">
                <h1 className="form-main-title">{t.loginTitle}</h1>
                <p className="form-subtitle">{t.loginSubtitle}</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="modern-auth-form">
                <div className="input-group">
                  <label htmlFor="login-email" className="input-label">
                    {t.email}
                  </label>
                  <div className="input-with-icon">
                    <FaEnvelope className="input-icon" />
                    <input
                      type="email"
                      id="login-email"
                      name="email"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      placeholder={t.emailPlaceholder}
                      className={`modern-input ${
                        loginErrors.email ? "error" : ""
                      }`}
                    />
                  </div>
                  {loginErrors.email && (
                    <span className="error-text">{loginErrors.email}</span>
                  )}
                </div>

                <div className="input-group">
                  <label htmlFor="login-password" className="input-label">
                    {t.password}
                  </label>
                  <div className="input-with-icon">
                    <FaLock className="input-icon" />
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      id="login-password"
                      name="password"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      placeholder={t.passwordPlaceholder}
                      className={`modern-input ${
                        loginErrors.password ? "error" : ""
                      }`}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      title={
                        showLoginPassword ? t.hidePassword : t.showPassword
                      }
                    >
                      {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <span className="error-text">{loginErrors.password}</span>
                  )}
                </div>

                <div className="form-options-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="checkbox-input"
                    />
                    <span className="checkbox-text">{t.remember}</span>
                  </label>
                  <a href="/forgot-password" className="forgot-link">
                    {t.forgot}
                  </a>
                </div>

                <button
                  type="submit"
                  className="submit-btn primary"
                  disabled={isLoading}
                >
                  {isLoading ? t.loggingIn : t.loginButton}
                </button>
              </form>

              <div className="social-login-section">
                <div className="divider-with-text">
                  <span>{t.socialOr}</span>
                </div>
                <div className="social-buttons-grid">
                  <button type="button" className="social-btn google-btn">
                    <FaGoogle />
                    <span>Google</span>
                  </button>
                  <button type="button" className="social-btn facebook-btn">
                    <FaFacebook />
                    <span>Facebook</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Register Form */}
          {activeTab === "signup" && (
            <div className="auth-form-container">
              <div className="form-title-section">
                <h1 className="form-main-title">{t.signupTitle}</h1>
                <p className="form-subtitle">{t.signupSubtitle}</p>
              </div>

              {/* Role Selection */}
              {!registerData.role ? (
                <div className="role-selection-section">
                  <h3 className="role-selection-title">{t.chooseRole}</h3>
                  <div className="role-cards-grid">
                    <button
                      type="button"
                      className="role-card"
                      onClick={() => handleRoleSelect("interpreter")}
                    >
                      <div className="role-icon-wrapper interpreter-color">
                        <FaUser />
                      </div>
                      <h4 className="role-card-title">{t.interpreter}</h4>
                      <p className="role-card-desc">{t.interpreterDesc}</p>
                    </button>
                    <button
                      type="button"
                      className="role-card"
                      onClick={() => handleRoleSelect("client")}
                    >
                      <div className="role-icon-wrapper company-color">
                        <FaBuilding />
                      </div>
                      <h4 className="role-card-title">{t.company}</h4>
                      <p className="role-card-desc">{t.companyDesc}</p>
                    </button>
                  </div>
                  {registerErrors.role && (
                    <span className="error-text center">
                      {registerErrors.role}
                    </span>
                  )}
                </div>
              ) : (
                <form
                  onSubmit={handleRegisterSubmit}
                  className="modern-auth-form"
                >
                  {/* Selected Role Display */}
                  <div className="selected-role-display">
                    <div className="selected-role-badge">
                      {registerData.role === "interpreter" ? (
                        <>
                          <FaUser /> {t.interpreter}
                        </>
                      ) : (
                        <>
                          <FaBuilding /> {t.company}
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      className="change-role-btn"
                      onClick={() =>
                        setRegisterData((prev) => ({ ...prev, role: "" }))
                      }
                    >
                      Change
                    </button>
                  </div>

                  {/* Full Name */}
                  <div className="input-group">
                    <label htmlFor="signup-fullname" className="input-label">
                      {t.fullName}
                    </label>
                    <div className="input-with-icon">
                      <FaUser className="input-icon" />
                      <input
                        type="text"
                        id="signup-fullname"
                        name="fullName"
                        value={registerData.fullName}
                        onChange={handleRegisterChange}
                        placeholder={t.fullNamePlaceholder}
                        className={`modern-input ${
                          registerErrors.fullName ? "error" : ""
                        }`}
                      />
                    </div>
                    {registerErrors.fullName && (
                      <span className="error-text">
                        {registerErrors.fullName}
                      </span>
                    )}
                  </div>

                  {/* Company Fields */}
                  {registerData.role === "client" && (
                    <>
                      <div className="input-group">
                        <label htmlFor="signup-company" className="input-label">
                          {t.companyName}
                        </label>
                        <div className="input-with-icon">
                          <FaBuilding className="input-icon" />
                          <input
                            type="text"
                            id="signup-company"
                            name="companyName"
                            value={registerData.companyName}
                            onChange={handleRegisterChange}
                            placeholder={t.companyNamePlaceholder}
                            className={`modern-input ${
                              registerErrors.companyName ? "error" : ""
                            }`}
                          />
                        </div>
                        {registerErrors.companyName && (
                          <span className="error-text">
                            {registerErrors.companyName}
                          </span>
                        )}
                      </div>

                      <div className="input-group">
                        <label
                          htmlFor="signup-company-type"
                          className="input-label"
                        >
                          {t.companyType}
                        </label>
                        <div className="input-with-icon">
                          <FaBriefcase className="input-icon" />
                          <select
                            id="signup-company-type"
                            name="companyType"
                            value={registerData.companyType}
                            onChange={handleRegisterChange}
                            className="modern-input modern-select"
                          >
                            <option value="corporation">{t.corporation}</option>
                            <option value="startup">{t.startup}</option>
                            <option value="nonprofit">{t.nonprofit}</option>
                            <option value="government">{t.government}</option>
                            <option value="healthcare">{t.healthcare}</option>
                            <option value="education">{t.education}</option>
                            <option value="other">{t.other}</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Email */}
                  <div className="input-group">
                    <label htmlFor="signup-email" className="input-label">
                      {t.email}
                    </label>
                    <div className="input-with-icon">
                      <FaEnvelope className="input-icon" />
                      <input
                        type="email"
                        id="signup-email"
                        name="email"
                        value={registerData.email}
                        onChange={handleRegisterChange}
                        placeholder={t.emailPlaceholder}
                        className={`modern-input ${
                          registerErrors.email ? "error" : ""
                        }`}
                      />
                    </div>
                    {registerErrors.email && (
                      <span className="error-text">{registerErrors.email}</span>
                    )}
                  </div>

                  {/* Password */}
                  <div className="input-group">
                    <label htmlFor="signup-password" className="input-label">
                      {t.password}
                    </label>
                    <div className="input-with-icon">
                      <FaLock className="input-icon" />
                      <input
                        type={showRegisterPassword ? "text" : "password"}
                        id="signup-password"
                        name="password"
                        value={registerData.password}
                        onChange={handleRegisterChange}
                        placeholder={t.passwordPlaceholder}
                        className={`modern-input ${
                          registerErrors.password ? "error" : ""
                        }`}
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() =>
                          setShowRegisterPassword(!showRegisterPassword)
                        }
                        title={
                          showRegisterPassword ? t.hidePassword : t.showPassword
                        }
                      >
                        {showRegisterPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {registerErrors.password && (
                      <span className="error-text">
                        {registerErrors.password}
                      </span>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="input-group">
                    <label
                      htmlFor="signup-confirm-password"
                      className="input-label"
                    >
                      {t.confirmPassword}
                    </label>
                    <div className="input-with-icon">
                      <FaLock className="input-icon" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="signup-confirm-password"
                        name="confirmPassword"
                        value={registerData.confirmPassword}
                        onChange={handleRegisterChange}
                        placeholder={t.confirmPasswordPlaceholder}
                        className={`modern-input ${
                          registerErrors.confirmPassword ? "error" : ""
                        }`}
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        title={
                          showConfirmPassword ? t.hidePassword : t.showPassword
                        }
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {registerErrors.confirmPassword && (
                      <span className="error-text">
                        {registerErrors.confirmPassword}
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="submit-btn primary"
                    disabled={isLoading}
                  >
                    {isLoading ? t.creatingAccount : t.signupButton}
                  </button>
                </form>
              )}

              {registerData.role && (
                <div className="social-login-section">
                  <div className="divider-with-text">
                    <span>{t.socialOr}</span>
                  </div>
                  <div className="social-buttons-grid">
                    <button type="button" className="social-btn google-btn">
                      <FaGoogle />
                      <span>Google</span>
                    </button>
                    <button type="button" className="social-btn facebook-btn">
                      <FaFacebook />
                      <span>Facebook</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
