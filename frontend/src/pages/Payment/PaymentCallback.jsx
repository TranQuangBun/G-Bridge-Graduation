import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import paymentService from "../../services/paymentService";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import styles from "./PaymentCallback.module.css";
import { toast } from "react-toastify";

export default function PaymentCallback() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("processing"); // processing, success, failed
  const [message, setMessage] = useState(t("paymentCallback.processing") || "Đang xử lý thanh toán...");

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get query parameters
        const queryParams = new URLSearchParams(location.search);
        
        // Convert URLSearchParams to object
        const paramsObj = {};
        for (const [key, value] of queryParams.entries()) {
          paramsObj[key] = value;
        }

        // Detect payment gateway based on query parameters
        const vnp_TxnRef = queryParams.get("vnp_TxnRef");
        const orderId = queryParams.get("orderId");
        const partnerCode = queryParams.get("partnerCode");
        
        let response;
        
        if (vnp_TxnRef) {
          // VNPay callback
          if (!vnp_TxnRef) {
            setStatus("failed");
            setMessage(t("paymentCallback.transactionNotFound") || "Không tìm thấy thông tin giao dịch");
            return;
          }
          response = await paymentService.verifyVNPayPayment(paramsObj);
        } else if (orderId || partnerCode) {
          // MoMo callback
          if (!orderId) {
            setStatus("failed");
            setMessage(t("paymentCallback.transactionNotFound") || "Không tìm thấy thông tin giao dịch");
            return;
          }
          response = await paymentService.verifyMoMoPayment(paramsObj);
        } else {
          setStatus("failed");
          setMessage(t("paymentCallback.transactionNotFound") || "Không tìm thấy thông tin giao dịch");
          return;
        }

        // Log response for debugging
        console.log("Payment verification response:", response);

        // Check if payment was successful
        // MoMo returns resultCode: "0" for success
        // resultCode "7002" means transaction is being processed
        const paymentStatus = response.data?.payment?.status;
        const resultCode = queryParams.get("resultCode") || response.data?.resultCode;
        const isProcessing = response.data?.isProcessing || resultCode === "7002" || 
                            (response.data?.message && response.data.message.toLowerCase().includes("being processed"));
        const isSuccess = response.success && (
          paymentStatus === "completed" ||
          resultCode === "0" ||
          (response.data?.payment && response.data.payment.status !== "failed" && resultCode === "0")
        );

        console.log("Payment verification result:", {
          isSuccess,
          isProcessing,
          paymentStatus,
          resultCode,
          responseSuccess: response.success,
        });

        if (isSuccess) {
          setStatus("success");
          setMessage(t("paymentCallback.successRedirecting") || "Thanh toán thành công! Đang chuyển hướng...");
          toast.success(t("paymentCallback.success") || "Thanh toán thành công!");

          // Redirect based on response or default to pricing
          const redirectPath = response.data?.redirect || "/pricing";
          setTimeout(() => {
            navigate(redirectPath);
          }, 3000);
        } else if (isProcessing) {
          // Payment is being processed - show processing state
          setStatus("processing");
          const processingMessage = response.data?.message || t("paymentCallback.processing") || "Giao dịch đang được xử lý. Vui lòng đợi xác nhận từ ngân hàng...";
          setMessage(processingMessage);
          toast.info(processingMessage);

          // Redirect after delay or let user manually redirect
          setTimeout(() => {
            navigate("/pricing?processing=true");
          }, 5000);
        } else {
          setStatus("failed");
          // Translate backend message if it's in English
          const backendMessage = response.data?.message || response.data?.payment?.momoMessage || queryParams.get("message");
          let translatedMessage = t("paymentCallback.failed") || "Thanh toán thất bại";
          
          // Map common English error messages to translations
          if (backendMessage) {
            const messageLower = backendMessage.toLowerCase();
            if (messageLower.includes("denied by user") || messageLower.includes("user cancelled")) {
              translatedMessage = t("paymentCallback.deniedByUser") || "Giao dịch bị từ chối bởi người dùng";
            } else if (messageLower.includes("transaction denied")) {
              translatedMessage = t("paymentCallback.deniedByUser") || "Giao dịch bị từ chối bởi người dùng";
            } else if (messageLower.includes("insufficient") || messageLower.includes("không đủ")) {
              translatedMessage = t("paymentCallback.insufficientFunds") || "Số dư không đủ";
            } else if (messageLower.includes("expired") || messageLower.includes("hết hạn")) {
              translatedMessage = t("paymentCallback.expired") || "Giao dịch đã hết hạn";
            } else if (messageLower.includes("invalid") || messageLower.includes("không hợp lệ")) {
              translatedMessage = t("paymentCallback.invalid") || "Thông tin giao dịch không hợp lệ";
            } else {
              // Use backend message as fallback, but prefer translation if available
              translatedMessage = backendMessage;
            }
          }
          
          setMessage(translatedMessage);
          toast.error(t("paymentCallback.failed") || "Thanh toán thất bại");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        console.error("Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        setStatus("failed");
        
        // Extract error message from response if available
        const errorMessage = error.response?.data?.message || error.message || t("paymentCallback.verificationError") || "Có lỗi xảy ra khi xác thực thanh toán";
        setMessage(errorMessage);
        toast.error(errorMessage);
      }
    };

    verifyPayment();
  }, [location.search, navigate, t]);

  return (
    <MainLayout>
      <div className={styles.callbackPage}>
        <div className={styles.container}>
          <div className={styles.card}>
            {status === "processing" && (
              <div className={styles.iconWrapper}>
                <div className={styles.spinner}></div>
              </div>
            )}
            {status === "success" && (
              <div className={styles.iconWrapper}>
                <svg
                  className={styles.successIcon}
                  viewBox="0 0 52 52"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    className={styles.successCircle}
                    cx="26"
                    cy="26"
                    r="25"
                    fill="none"
                  />
                  <path
                    className={styles.successCheck}
                    fill="none"
                    d="M14.1 27.2l7.1 7.2 16.7-16.8"
                  />
                </svg>
              </div>
            )}
            {status === "failed" && (
              <div className={styles.iconWrapper}>
                <svg
                  className={styles.errorIcon}
                  viewBox="0 0 52 52"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    className={styles.errorCircle}
                    cx="26"
                    cy="26"
                    r="25"
                    fill="none"
                  />
                  <path
                    className={styles.errorCross}
                    fill="none"
                    d="M16 16 36 36 M36 16 16 36"
                  />
                </svg>
              </div>
            )}
            <h1 className={styles.title}>
              {status === "processing" && (t("paymentCallback.processing") || "Đang xử lý...")}
              {status === "success" && (t("paymentCallback.success") || "Thanh toán thành công!")}
              {status === "failed" && (t("paymentCallback.failed") || "Thanh toán thất bại")}
            </h1>
            <p className={styles.message}>{message}</p>
            {status !== "processing" && (
              <div className={styles.actions}>
                <button
                  onClick={() => navigate("/pricing")}
                  className={styles.btn}
                >
                  {t("paymentCallback.backToPricing") || "Quay lại trang giá"}
                </button>
                {status === "success" && (
                  <button
                    onClick={() => navigate("/dashboard")}
                    className={`${styles.btn} ${styles.primary}`}
                  >
                    {t("paymentCallback.goToDashboard") || "Đi đến Dashboard"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
