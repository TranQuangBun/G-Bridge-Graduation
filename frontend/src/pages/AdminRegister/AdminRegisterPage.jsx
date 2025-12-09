import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../hooks/useToast";
import { ToastContainer } from "../../components/Toast";
import { ROUTES } from "../../constants";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUser,
} from "react-icons/fa";
import "./AdminRegisterPage.css";

const AdminRegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toasts, showSuccess, showError, removeToast } = useToast();

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Vui lòng nhập họ tên";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!formData.password) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu không khớp";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || "http://localhost:4000/api"}/auth/register-admin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName: formData.fullName,
            email: formData.email,
            password: formData.password,
            role: "admin",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Đăng ký thất bại");
      }

      showSuccess("Đăng ký admin thành công! Đang đăng nhập...");

      // Auto login after registration
      setTimeout(async () => {
        try {
          await login(formData.email, formData.password);
          navigate(ROUTES.ADMIN_DASHBOARD);
        } catch (error) {
          showError("Đăng ký thành công nhưng đăng nhập thất bại. Vui lòng đăng nhập thủ công.");
          navigate(ROUTES.LOGIN);
        }
      }, 1500);
    } catch (error) {
      console.error("Registration error:", error);
      showError(error.message || "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className="admin-register-page">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <div className="admin-register-container">
        <div className="admin-register-card">
          <div className="admin-register-header">
            <h1>Đăng ký Admin</h1>
            <p>Tạo tài khoản quản trị viên mới</p>
          </div>

          <form onSubmit={handleSubmit} className="admin-register-form">
            <div className="form-group">
              <label htmlFor="fullName">
                <FaUser /> Họ và tên
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Nhập họ tên đầy đủ"
                className={errors.fullName ? "error" : ""}
              />
              {errors.fullName && (
                <span className="error-message">{errors.fullName}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <FaEnvelope /> Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Nhập email"
                className={errors.email ? "error" : ""}
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <FaLock /> Mật khẩu
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                  className={errors.password ? "error" : ""}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                <FaLock /> Xác nhận mật khẩu
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu"
                  className={errors.confirmPassword ? "error" : ""}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="error-message">{errors.confirmPassword}</span>
              )}
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? "Đang tạo tài khoản..." : "Tạo tài khoản Admin"}
            </button>
          </form>

          <div className="admin-register-footer">
            <p>
              Đã có tài khoản? <Link to={ROUTES.LOGIN}>Đăng nhập</Link>
            </p>
            <p>
              <Link to={ROUTES.HOME}>← Quay về trang chủ</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRegisterPage;

