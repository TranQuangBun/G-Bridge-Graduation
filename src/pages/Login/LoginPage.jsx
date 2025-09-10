import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES, LANGUAGES } from "../../constants";
import "./LoginPage.css";
// Reuse header-style logo (no image file needed)
import VNFlag from "../../assets/images/languages/VN.png";
import USFlag from "../../assets/images/languages/US.png";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || LANGUAGES.VI
  );
  const [showPassword, setShowPassword] = useState(false);

  const t = {
    vi: {
      title: "Đăng nhập",
      subtitle:
        "Chào mừng bạn quay lại! Vui lòng đăng nhập vào tài khoản của bạn.",
      email: "Địa chỉ email",
      emailPlaceholder: "example@email.com",
      password: "Mật khẩu",
      passwordPlaceholder: "Nhập mật khẩu của bạn",
      remember: "Ghi nhớ đăng nhập",
      forgot: "Quên mật khẩu?",
      login: "Đăng nhập",
      loggingIn: "Đang đăng nhập...",
      socialOr: "Hoặc đăng nhập với",
      noAccount: "Chưa có tài khoản?",
      registerFree: "Đăng ký miễn phí",
      emailRequired: "Vui lòng nhập email",
      emailInvalid: "Email không hợp lệ",
      passwordRequired: "Vui lòng nhập mật khẩu",
      switchHint: "Chuyển ngôn ngữ",
      showPassword: "Hiện mật khẩu",
      hidePassword: "Ẩn mật khẩu",
    },
    en: {
      title: "Login",
      subtitle: "Welcome back! Please sign in to your account.",
      email: "Email address",
      emailPlaceholder: "example@email.com",
      password: "Password",
      passwordPlaceholder: "Enter your password",
      remember: "Remember me",
      forgot: "Forgot password?",
      login: "Login",
      loggingIn: "Logging in...",
      socialOr: "Or login with",
      noAccount: "Don't have an account?",
      registerFree: "Register for free",
      emailRequired: "Please enter email",
      emailInvalid: "Invalid email",
      passwordRequired: "Please enter password",
      switchHint: "Switch language",
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

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = t.emailRequired;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t.emailInvalid;
    }
    if (!formData.password) {
      newErrors.password = t.passwordRequired;
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
      console.log("Login data:", formData);
      alert(
        language === LANGUAGES.VI
          ? "Đăng nhập thành công!"
          : "Login successful!"
      );
    } catch (error) {
      console.error("Login error:", error);
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
              title={t.switchHint}
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

            <div className="form-options">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkmark"></span>
                {t.remember}
              </label>
              <Link to="/forgot-password" className="forgot-password">
                {t.forgot}
              </Link>
            </div>

            <button
              type="submit"
              className={`auth-btn ${isLoading ? "loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? t.loggingIn : t.login}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              {t.noAccount}
              <Link to={ROUTES.REGISTER} className="auth-link">
                {t.registerFree}
              </Link>
            </p>
          </div>

          <div className="social-login">
            <div className="divider">
              <span>{t.socialOr}</span>
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

export default LoginPage;
