import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "../../translet/LanguageContext";
import { toast } from "react-toastify";
import authService from "../../services/authService";
import { ROUTES } from "../../constants";
import styles from "./ResetPasswordPage.module.css";

const ResetPasswordPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password) {
      toast.error(
        t("resetPassword.errors.passwordRequired") || "Password is required"
      );
      return;
    }

    if (password.length < 6) {
      toast.error(
        t("resetPassword.errors.passwordTooShort") ||
          "Password must be at least 6 characters"
      );
      return;
    }

    if (password !== confirmPassword) {
      toast.error(
        t("resetPassword.errors.passwordMismatch") || "Passwords do not match"
      );
      return;
    }

    if (!token) {
      toast.error(
        t("resetPassword.errors.invalidToken") || "Invalid reset token"
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.resetPassword(token, password);

      if (response.success) {
        toast.success(
          t("resetPassword.success") || "Password reset successfully!"
        );
        setTimeout(() => {
          navigate(ROUTES.LOGIN);
        }, 2000);
      } else {
        toast.error(response.message || t("resetPassword.errors.failed"));
      }
    } catch (error) {
      toast.error(
        error.message ||
          t("resetPassword.errors.failed") ||
          "Failed to reset password"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            {t("resetPassword.title") || "Reset Password"}
          </h1>
          <p className={styles.description}>
            {t("resetPassword.description") || "Enter your new password below."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>
              {t("resetPassword.newPasswordLabel") || "New Password"}
            </label>
            <div className={styles.passwordInputWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  t("resetPassword.passwordPlaceholder") || "Enter new password"
                }
                className={styles.input}
                disabled={isLoading}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "" : ""}
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              {t("resetPassword.confirmPasswordLabel") || "Confirm Password"}
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={
                t("resetPassword.confirmPasswordPlaceholder") ||
                "Confirm new password"
              }
              className={styles.input}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading
              ? t("resetPassword.resetting") || "Resetting..."
              : t("resetPassword.resetButton") || "Reset Password"}
          </button>
        </form>

        <button
          className={styles.backLink}
          onClick={() => navigate(ROUTES.LOGIN)}
        >
          ← {t("resetPassword.backToLogin") || "Back to Login"}
        </button>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
