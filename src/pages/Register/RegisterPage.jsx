import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES, LANGUAGES } from "../../constants";
import VNFlag from "../../assets/images/languages/VN.png";
import USFlag from "../../assets/images/languages/US.png";
// Use header style logo instead of image file
import "./RegisterPage.css";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    role: "interpreter",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || LANGUAGES.VI
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const t = {
    vi: {
      title: "Tạo tài khoản",
      subtitle: "Gia nhập cộng đồng G-Bridge ngay hôm nay",
      fullName: "Họ tên",
      fullNamePlaceholder: "Nhập họ tên của bạn",
      role: "Bạn là",
      interpreter: "Phiên dịch viên",
      employer: "Nhà tuyển dụng",
      email: "Email",
      password: "Mật khẩu",
      confirmPassword: "Xác nhận mật khẩu",
      emailPlaceholder: "Nhập email của bạn",
      passwordPlaceholder: "Nhập mật khẩu",
      confirmPasswordPlaceholder: "Nhập lại mật khẩu",
      submit: "Tạo tài khoản",
      already: "Đã có tài khoản?",
      login: "Đăng nhập ngay",
      or: "Hoặc đăng ký với",
      required: "Vui lòng nhập",
      invalidEmail: "Email không hợp lệ",
      passwordLength: "Mật khẩu phải có ít nhất 6 ký tự",
      passwordMatch: "Mật khẩu xác nhận không khớp",
      loading: "Đang xử lý...",
      showPassword: "Hiện mật khẩu",
      hidePassword: "Ẩn mật khẩu",
    },
    en: {
      title: "Create Account",
      subtitle: "Join the G-Bridge community today",
      fullName: "Full Name",
      fullNamePlaceholder: "Enter your full name",
      role: "You are",
      interpreter: "Interpreter",
      employer: "Employer",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      emailPlaceholder: "Enter your email",
      passwordPlaceholder: "Enter your password",
      confirmPasswordPlaceholder: "Re-enter your password",
      submit: "Create Account",
      already: "Already have an account?",
      login: "Login now",
      or: "Or sign up with",
      required: "Please enter",
      invalidEmail: "Invalid email",
      passwordLength: "Password must be at least 6 characters",
      passwordMatch: "Passwords do not match",
      loading: "Processing...",
      showPassword: "Show password",
      hidePassword: "Hide password",
    },
  }[language];

  const handleLanguageSwitch = () => {
    const newLang = language === LANGUAGES.VI ? LANGUAGES.EN : LANGUAGES.VI;
    setLanguage(newLang);
    localStorage.setItem("language", newLang);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = `${t.required} ${t.fullName.toLowerCase()}`;
    }
    if (!formData.email.trim()) {
      newErrors.email = `${t.required} ${t.email.toLowerCase()}`;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t.invalidEmail;
    }
    if (!formData.password) {
      newErrors.password = `${t.required} ${t.password.toLowerCase()}`;
    } else if (formData.password.length < 6) {
      newErrors.password = t.passwordLength;
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = `${
        t.required
      } ${t.confirmPassword.toLowerCase()}`;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t.passwordMatch;
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Register data:", formData);
      alert("Đăng ký thành công!");
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>
      </div>

      <div className="auth-container">
        <div className="auth-card">
          {/* Brand + Language */}
          <div className="brand-header">
            <Link
              to={ROUTES.HOME}
              className="brand-link brand-link--inline"
              aria-label="G-Bridge Home"
            >
              <div className="logo-icon">
                <span className="logo-text">G</span>
              </div>
              <span className="brand-name">G-Bridge</span>
            </Link>
            <button
              type="button"
              className="language-toggle"
              onClick={handleLanguageSwitch}
              title={
                language === LANGUAGES.VI
                  ? "Switch to English"
                  : "Chuyển sang Tiếng Việt"
              }
            >
              <img
                src={language === LANGUAGES.VI ? VNFlag : USFlag}
                alt={language === LANGUAGES.VI ? "Vietnamese" : "English"}
                className="language-flag"
              />
              <span className="language-code">{language.toUpperCase()}</span>
            </button>
          </div>

          <div className="auth-header">
            <h1 className="auth-title-gradient">{t.title}</h1>
            <p className="auth-subtitle-text">{t.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fullName">{t.fullName}</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder={t.fullNamePlaceholder}
                  className={errors.fullName ? "error" : ""}
                />
                {errors.fullName && (
                  <span className="error-message">{errors.fullName}</span>
                )}
              </div>
              <div className="form-group role-group">
                <label htmlFor="role" className="role-label">
                  {t.role}
                </label>
                <div className="role-select-wrapper">
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="role-select"
                  >
                    <option value="interpreter">{t.interpreter}</option>
                    <option value="employer">{t.employer}</option>
                  </select>
                  <div className="role-hint">
                    {formData.role === "interpreter" ? (
                      <span className="role-badge interpreter">
                        {t.interpreter}
                      </span>
                    ) : (
                      <span className="role-badge employer">{t.employer}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">{t.email}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t.emailPlaceholder}
                className={errors.email ? "error" : ""}
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">{t.password}</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t.passwordPlaceholder}
                  className={errors.password ? "error" : ""}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? t.hidePassword : t.showPassword}
                  title={showPassword ? t.hidePassword : t.showPassword}
                >
                  <span role="img" aria-hidden="true">
                    {showPassword ? "🐵" : "🙈"}
                  </span>
                </button>
              </div>
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">{t.confirmPassword}</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder={t.confirmPasswordPlaceholder}
                  className={errors.confirmPassword ? "error" : ""}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  aria-label={
                    showConfirmPassword ? t.hidePassword : t.showPassword
                  }
                  title={showConfirmPassword ? t.hidePassword : t.showPassword}
                >
                  <span role="img" aria-hidden="true">
                    {showConfirmPassword ? "🐵" : "🙈"}
                  </span>
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="error-message">{errors.confirmPassword}</span>
              )}
            </div>

            <button
              type="submit"
              className={`auth-btn ${isLoading ? "loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  {t.loading}
                </>
              ) : (
                t.submit
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              {t.already}
              <Link to={ROUTES.LOGIN} className="auth-link">
                {t.login}
              </Link>
            </p>
          </div>

          <div className="social-login">
            <div className="divider">
              <span>{t.or}</span>
            </div>
            <div className="social-buttons">
              <button className="social-btn google">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>
              <button className="social-btn facebook">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    fill="#1877F2"
                    d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                  />
                </svg>
                Facebook
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
