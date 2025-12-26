import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import paymentService from "../../services/paymentService";
import { MainLayout } from "../../layouts";
import styles from "./PaymentCallback.module.css";
import { toast } from "react-toastify";

export default function PaymentCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("processing"); // processing, success, failed
  const [message, setMessage] = useState("Đang xử lý thanh toán...");

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
            setMessage("Không tìm thấy thông tin giao dịch");
            return;
          }
          response = await paymentService.verifyVNPayPayment(paramsObj);
        } else if (orderId || partnerCode) {
          // MoMo callback
          if (!orderId) {
            setStatus("failed");
            setMessage("Không tìm thấy thông tin giao dịch");
            return;
          }
          response = await paymentService.verifyMoMoPayment(paramsObj);
        } else {
          setStatus("failed");
          setMessage("Không tìm thấy thông tin giao dịch");
          return;
        }

        // Check if payment was successful
        const isSuccess = response.success && (
          response.data?.payment?.status === "completed" ||
          response.data?.success === true ||
          (response.data?.payment && response.data.payment.status !== "failed")
        );

        if (isSuccess) {
          setStatus("success");
          setMessage("Thanh toán thành công! Đang chuyển hướng...");
          toast.success("Thanh toán thành công!");

          // Redirect based on response or default to pricing
          const redirectPath = response.data?.redirect || "/pricing";
          setTimeout(() => {
            navigate(redirectPath);
          }, 3000);
        } else {
          setStatus("failed");
          setMessage(response.data?.message || response.data?.payment?.momoMessage || "Thanh toán thất bại");
          toast.error("Thanh toán thất bại");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setStatus("failed");
        setMessage(error.message || "Có lỗi xảy ra khi xác thực thanh toán");
        toast.error("Lỗi xác thực thanh toán");
      }
    };

    verifyPayment();
  }, [location.search, navigate]);

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
              {status === "processing" && "Đang xử lý..."}
              {status === "success" && "Thanh toán thành công!"}
              {status === "failed" && "Thanh toán thất bại"}
            </h1>
            <p className={styles.message}>{message}</p>
            {status !== "processing" && (
              <div className={styles.actions}>
                <button
                  onClick={() => navigate("/pricing")}
                  className={styles.btn}
                >
                  Quay lại trang giá
                </button>
                {status === "success" && (
                  <button
                    onClick={() => navigate("/dashboard")}
                    className={`${styles.btn} ${styles.primary}`}
                  >
                    Đi đến Dashboard
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
