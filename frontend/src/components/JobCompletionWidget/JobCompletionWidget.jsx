import React, { useState } from "react";
import styles from "./JobCompletionWidget.module.css";
import { FaCheckCircle, FaHourglass, FaTimes } from "react-icons/fa";
import jobService from "../../services/jobService";
import { useLanguage } from "../../translet/LanguageContext";

function JobCompletionWidget({ application, currentUserId, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  if (!application || application.status !== "approved") {
    return null;
  }

  // If job is already completed
  if (application.completedAt) {
    return (
      <div className={styles.completionWidget}>
        <div className={styles.completedBanner}>
          <FaCheckCircle className={styles.checkIcon} />
          <div>
            <h4>
              {t("applications.completion.jobCompleted") ||
                "Công việc đã hoàn thành"}
            </h4>
            <p>
              {t("applications.completion.canReviewNow") ||
                "Bạn có thể đánh giá công việc này ngay bây giờ"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isRequester =
    application.completionRequestedBy === parseInt(currentUserId);
  const isPending = !!application.completionRequestedBy;
  const canConfirm = isPending && !isRequester;

  const handleRequestCompletion = async () => {
    if (
      !window.confirm(
        t("applications.completion.confirmRequest") ||
          "Bạn có chắc muốn yêu cầu hoàn thành công việc này?"
      )
    )
      return;

    setLoading(true);
    try {
      const response = await jobService.requestJobCompletion(application.id);
      if (onUpdate) {
        onUpdate(response.data);
      }
    } catch (error) {
      alert(
        error.message ||
          t("applications.completion.requestError") ||
          "Không thể gửi yêu cầu"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCompletion = async () => {
    if (
      !window.confirm(
        t("applications.completion.confirmComplete") ||
          "Xác nhận rằng công việc đã hoàn thành?"
      )
    )
      return;

    setLoading(true);
    try {
      const response = await jobService.confirmJobCompletion(application.id);
      if (onUpdate) {
        onUpdate(response.data);
      }
      alert(
        t("applications.completion.completionMarked") ||
          "Công việc đã được đánh dấu hoàn thành!"
      );
    } catch (error) {
      alert(
        error.message ||
          t("applications.completion.confirmError") ||
          "Không thể xác nhận"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (
      !window.confirm(
        t("applications.completion.confirmCancel") ||
          "Hủy yêu cầu hoàn thành công việc?"
      )
    )
      return;

    setLoading(true);
    try {
      const response = await jobService.cancelJobCompletionRequest(
        application.id
      );
      if (onUpdate) {
        onUpdate(response.data);
      }
    } catch (error) {
      alert(
        error.message ||
          t("applications.completion.cancelError") ||
          "Không thể hủy yêu cầu"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.completionWidget}>
      {isPending ? (
        canConfirm ? (
          // Other party requested, need confirmation
          <div className={styles.pendingRequest}>
            <FaHourglass className={styles.pendingIcon} />
            <div className={styles.pendingContent}>
              <h4>
                {t("applications.completion.requestTitle") ||
                  "Yêu cầu hoàn thành công việc"}
              </h4>
              <p>
                {t("applications.completion.requestMessage") ||
                  "Đối phương đã yêu cầu hoàn thành công việc. Bạn có đồng ý không?"}
              </p>
              <div className={styles.actions}>
                <button
                  onClick={handleConfirmCompletion}
                  disabled={loading}
                  className={styles.confirmBtn}
                >
                  <FaCheckCircle />{" "}
                  {t("applications.completion.agree") || "Đồng ý"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Current user requested, waiting for confirmation
          <div className={styles.pendingRequest}>
            <FaHourglass className={styles.pendingIcon} />
            <div className={styles.pendingContent}>
              <h4>
                {t("applications.completion.waitingConfirmation") ||
                  "Đang chờ xác nhận"}
              </h4>
              <p>
                {t("applications.completion.waitingMessage") ||
                  "Bạn đã yêu cầu hoàn thành công việc. Đang chờ đối phương xác nhận."}
              </p>
              <button
                onClick={handleCancelRequest}
                disabled={loading}
                className={styles.cancelBtn}
              >
                <FaTimes />{" "}
                {t("applications.completion.cancelRequest") || "Hủy yêu cầu"}
              </button>
            </div>
          </div>
        )
      ) : (
        // No request yet
        <div className={styles.requestSection}>
          <button
            onClick={handleRequestCompletion}
            disabled={loading}
            className={styles.requestBtn}
          >
            <FaCheckCircle />{" "}
            {t("applications.completion.request") || "Hoàn thành công việc"}
          </button>
          <p className={styles.hint}>
            {t("applications.completion.hint") ||
              "Sau khi cả hai bên đồng ý, công việc sẽ được đánh dấu hoàn thành"}
          </p>
        </div>
      )}
    </div>
  );
}

export default JobCompletionWidget;
