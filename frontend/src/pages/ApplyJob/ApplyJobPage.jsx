import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { ROUTES } from "../../constants/enums";
import jobService from "../../services/jobService.js";
import styles from "./ApplyJobPage.module.css";
import {
  FaArrowLeft,
  FaFileUpload,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
} from "react-icons/fa";

export default function ApplyJobPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [applicationData, setApplicationData] = useState({
    pdfFile: null,
    introduction: "",
    profileLink: "",
  });
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "error",
  });

  // Notification functions
  function showNotification(message, type = "error") {
    setNotification({
      show: true,
      message,
      type,
    });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 5000);
  }

  function hideNotification() {
    setNotification((prev) => ({ ...prev, show: false }));
  }

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated || !user) {
      showNotification(
        t("findJob.errors.loginRequired") || "Vui lòng đăng nhập để ứng tuyển",
        "error"
      );
      navigate(ROUTES.LOGIN);
    }
  }, [isAuthenticated, user, navigate, t]);

  // Fetch job details
  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const response = await jobService.getJobById(id);
        
        if (response && (response.success || response.data)) {
          const jobData = response.data?.job || response.data || {};
          
          const transformedJob = {
            id: jobData.id,
            title: jobData.title,
            company: jobData.organization?.name || "Company",
          };
          
          setJob(transformedJob);
        } else {
          showNotification("Job not found", "error");
          navigate(ROUTES.FIND_JOB);
        }
      } catch (error) {
        console.error("Error fetching job:", error);
        showNotification(error.message || "Error loading job details", "error");
        navigate(ROUTES.FIND_JOB);
      } finally {
        setLoading(false);
      }
    };

    if (id && isAuthenticated) {
      fetchJob();
    }
  }, [id, isAuthenticated, navigate]);

  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      setApplicationData((prev) => ({
        ...prev,
        pdfFile: file,
      }));
    } else {
      showNotification(
        t("findJob.applicationModal.pdfOnlyError") || "Chỉ chấp nhận file PDF",
        "error"
      );
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validate required fields
    if (!applicationData.pdfFile && !applicationData.introduction.trim()) {
      showNotification(
        t("findJob.applicationModal.validationError") || "Vui lòng điền đầy đủ thông tin",
        "error"
      );
      return;
    }

    if (!applicationData.pdfFile) {
      showNotification(
        t("findJob.applicationModal.missingCV") || "Vui lòng upload CV",
        "error"
      );
      return;
    }

    if (!applicationData.introduction.trim()) {
      showNotification(
        t("findJob.applicationModal.missingIntro") || "Vui lòng nhập giới thiệu",
        "error"
      );
      return;
    }

    try {
      setSubmitting(true);

      // For now, we'll send the application data as JSON
      // Backend expects: coverLetter, resumeUrl, resumeType
      // TODO: Implement file upload endpoint to get resumeUrl
      const applicationPayload = {
        coverLetter: applicationData.introduction,
        resumeUrl: applicationData.profileLink || null, // Temporary: using profileLink as resumeUrl
        resumeType: applicationData.pdfFile ? "pdf" : null,
      };

      const response = await jobService.applyForJob(id, applicationPayload);

      if (response && response.success !== false) {
        showNotification(
          t("findJob.applicationModal.successMessage") || "Ứng tuyển thành công!",
          "success"
        );
        
        // Redirect to my applications after 2 seconds
        setTimeout(() => {
          navigate(ROUTES.MY_APPLICATIONS);
        }, 2000);
      } else {
        showNotification(
          response.message || "Có lỗi xảy ra khi ứng tuyển",
          "error"
        );
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      showNotification(
        error.message || (t("findJob.applicationModal.errorMessage") || "Không thể gửi đơn ứng tuyển"),
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className={styles.loadingContainer}>
          <div className={styles.loading}>{t("common.loading") || "Loading..."}</div>
        </div>
      </MainLayout>
    );
  }

  if (!job) {
    return (
      <MainLayout>
        <div className={styles.errorContainer}>
          <div className={styles.error}>{t("common.notFound") || "Job not found"}</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Notification */}
      {notification.show && (
        <div className={styles.notificationOverlay}>
          <div
            className={`${styles.notification} ${
              styles[notification.type]
            }`}
          >
            <div className={styles.notificationContent}>
              <div className={styles.notificationIcon}>
                {notification.type === "error" && <FaExclamationTriangle />}
                {notification.type === "success" && <FaCheckCircle />}
                {notification.type === "warning" && <FaClock />}
                {notification.type === "info" && <FaInfoCircle />}
              </div>
              <div className={styles.notificationMessage}>
                {notification.message}
              </div>
              <button onClick={hideNotification} className={styles.notificationClose}>
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.applyJobRoot}>
        {/* Back Button */}
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <FaArrowLeft /> {t("common.back") || "Quay lại"}
        </button>

        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>
            {t("findJob.applicationModal.title") || "Ứng tuyển"} - {job.title}
          </h1>
          <p className={styles.subtitle}>{job.company}</p>
        </div>

        {/* Application Form */}
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              {t("findJob.applicationModal.uploadCV") || "Upload CV"} {" "}
              <span className={styles.required}>
                {t("findJob.applicationModal.required") || "*"}
              </span>
            </label>
            <div className={styles.fileUploadArea}>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className={styles.fileInput}
                id="cv-upload"
              />
              <label htmlFor="cv-upload" className={styles.fileUploadLabel}>
                <FaFileUpload /> {t("findJob.applicationModal.chooseFile") || "Chọn file PDF"}
              </label>
              {applicationData.pdfFile && (
                <div className={styles.filePreview}>
                  📄 {applicationData.pdfFile.name}
                </div>
              )}
            </div>
            <p className={styles.fieldHint}>
              {t("findJob.applicationModal.pdfOnly") || "Chỉ chấp nhận file PDF, tối đa 5MB"}
            </p>
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              {t("findJob.applicationModal.introduction") || "Giới thiệu bản thân"} {" "}
              <span className={styles.required}>
                {t("findJob.applicationModal.required") || "*"}
              </span>
            </label>
            <textarea
              value={applicationData.introduction}
              onChange={(e) =>
                setApplicationData((prev) => ({
                  ...prev,
                  introduction: e.target.value,
                }))
              }
              placeholder={t("findJob.applicationModal.introPlaceholder") || "Viết một vài dòng giới thiệu về bản thân và lý do bạn phù hợp với công việc này..."}
              className={styles.textArea}
              rows={8}
              required
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              {t("findJob.applicationModal.profileLink") || "Link hồ sơ (tùy chọn)"}
            </label>
            <input
              type="url"
              value={applicationData.profileLink}
              onChange={(e) =>
                setApplicationData((prev) => ({
                  ...prev,
                  profileLink: e.target.value,
                }))
              }
              placeholder={t("findJob.applicationModal.profilePlaceholder") || "https://linkedin.com/in/your-profile"}
              className={styles.textInput}
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              {t("findJob.applicationModal.cancel") || "Hủy"}
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <FaClock /> {t("common.loading") || "Đang xử lý..."}
                </>
              ) : (
                t("findJob.applicationModal.submit") || "Gửi đơn ứng tuyển"
              )}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}

