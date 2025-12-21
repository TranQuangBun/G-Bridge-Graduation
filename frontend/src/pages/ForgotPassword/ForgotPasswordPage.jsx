import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../translet/LanguageContext";
import { toast } from "react-toastify";
import authService from "../../services/authService";
import { ROUTES } from "../../constants";
import styles from "./ForgotPasswordPage.module.css";

const ForgotPasswordPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error(
        t("forgotPassword.errors.emailRequired") || "Email is required"
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.forgotPassword(email);

      if (response.success) {
        setEmailSent(true);
        toast.success(
          t("forgotPassword.success") ||
            "Password reset link has been sent to your email"
        );
      } else {
        toast.error(response.message || t("forgotPassword.errors.failed"));
      }
    } catch (error) {
      toast.error(
        error.message ||
          t("forgotPassword.errors.failed") ||
          "Failed to send reset email"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.successIcon}></div>
          <h1 className={styles.title}>
            {t("forgotPassword.emailSent.title") || "Check Your Email"}
          </h1>
          <p className={styles.description}>
            {t("forgotPassword.emailSent.description") ||
              "We've sent a password reset link to your email address. Please check your inbox and follow the instructions."}
          </p>
          <p className={styles.email}>{email}</p>
          <button
            className={styles.backButton}
            onClick={() => navigate(ROUTES.LOGIN)}
          >
            {t("forgotPassword.backToLogin") || "Back to Login"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            {t("forgotPassword.title") || "Forgot Password?"}
          </h1>
          <p className={styles.description}>
            {t("forgotPassword.description") ||
              "Enter your email address and we'll send you a link to reset your password."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>
              {t("forgotPassword.emailLabel") || "Email Address"}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                t("forgotPassword.emailPlaceholder") || "Enter your email"
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
              ? t("forgotPassword.sending") || "Sending..."
              : t("forgotPassword.sendButton") || "Send Reset Link"}
          </button>
        </form>

        <button
          className={styles.backLink}
          onClick={() => navigate(ROUTES.LOGIN)}
        >
          ← {t("forgotPassword.backToLogin") || "Back to Login"}
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
