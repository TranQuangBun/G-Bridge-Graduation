import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MainLayout } from "../../layouts";
import { useAuth } from "../../contexts/AuthContext";
import * as paymentService from "../../services/paymentService";
import styles from "./PaymentSuccessPage.module.css";

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("Verifying your payment...");
  const [subscriptionData, setSubscriptionData] = useState(null);

  useEffect(() => {
    const verifyVNPayPayment = async () => {
      const queryParams = {};
      for (const [key, value] of searchParams.entries()) {
        queryParams[key] = value;
      }

      console.log("🔍 Verifying VNPay payment with params:", queryParams);

      try {
        const response = await paymentService.verifyVNPayPayment(queryParams);

        console.log("📦 VNPay verification response:", response);

        if (response.success) {
          setStatus("success");
          setMessage(
            "Payment successful! Your subscription has been activated."
          );
          setSubscriptionData({
            planName: response.subscription?.planName,
            startDate: response.subscription?.startDate,
            endDate: response.subscription?.endDate,
            amount: response.payment?.amount,
          });

          // Refresh user data to update subscription badge
          console.log("🔄 Refreshing user data...");
          await refreshUser();
          console.log("✅ User data refreshed!");

          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            navigate("/dashboard");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(
            response.message ||
              `Payment verification failed. Response code: ${queryParams.vnp_ResponseCode}`
          );
        }
      } catch (error) {
        console.error("❌ VNPay verification error:", error);
        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            error.message ||
            "Payment verification failed. Please contact support."
        );
      }
    };

    const verifyPayPalPayment = async (orderId, paypalOrderId) => {
      try {
        const response = await paymentService.verifyPayPalPayment(
          orderId,
          paypalOrderId
        );

        if (response.success) {
          setStatus("success");
          setMessage(
            "Payment successful! Your subscription has been activated."
          );
          setSubscriptionData({
            planName: response.subscription?.planName,
            startDate: response.subscription?.startDate,
            endDate: response.subscription?.endDate,
            amount: response.payment?.amount,
          });

          // Refresh user data to update subscription badge
          console.log("🔄 Refreshing user data...");
          await refreshUser();
          console.log("✅ User data refreshed!");

          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            navigate("/dashboard");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(response.message || "Payment verification failed.");
        }
      } catch (error) {
        console.error("❌ PayPal verification error:", error);
        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            error.message ||
            "Payment verification failed. Please contact support."
        );
      }
    };

    const verifyPayment = async () => {
      try {
        // Check if it's VNPay callback (has vnp_ params)
        const vnpResponseCode = searchParams.get("vnp_ResponseCode");
        const vnpTxnRef = searchParams.get("vnp_TxnRef");

        // Check if it's PayPal callback (has orderId param)
        const orderId = searchParams.get("orderId");
        const paypalOrderId = searchParams.get("token"); // PayPal returns token param

        if (vnpResponseCode && vnpTxnRef) {
          // VNPay callback - check response code first
          console.log("🔍 VNPay Response Code:", vnpResponseCode);

          if (vnpResponseCode !== "00") {
            // Payment was not successful
            setStatus("error");

            // Map VNPay response codes to user-friendly messages
            const errorMessages = {
              "07": "Transaction suspected of fraud",
              "09": "Card/Account not registered for service",
              10: "Card/Account authentication failed 3 times",
              11: "Payment timeout. Please try again",
              12: "Card/Account is locked",
              13: "Invalid OTP",
              24: "Transaction cancelled by user",
              51: "Insufficient account balance",
              65: "Account has exceeded daily transaction limit",
              75: "Payment gateway is under maintenance",
              79: "Payment amount exceeds limit",
            };

            const errorMsg =
              errorMessages[vnpResponseCode] ||
              `Payment failed with code: ${vnpResponseCode}`;

            setMessage(errorMsg);
            console.log("❌ Payment cancelled or failed:", errorMsg);
            return;
          }

          // Response code is "00" - proceed with verification
          await verifyVNPayPayment();
        } else if (orderId && paypalOrderId) {
          // PayPal callback
          await verifyPayPalPayment(orderId, paypalOrderId);
        } else {
          setStatus("error");
          setMessage("Invalid payment callback. Missing required parameters.");
        }
      } catch (error) {
        console.error("Payment verification failed:", error);
        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            "Payment verification failed. Please contact support."
        );
      }
    };

    verifyPayment();
  }, [searchParams, navigate, refreshUser]);

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.card}>
          {status === "verifying" && (
            <div className={styles.verifying}>
              <div className={styles.spinner}></div>
              <h2>Verifying Payment</h2>
              <p>{message}</p>
            </div>
          )}

          {status === "success" && (
            <div className={styles.success}>
              <div className={styles.icon}>✓</div>
              <h2>Payment Successful!</h2>
              <p className={styles.message}>{message}</p>

              {subscriptionData && (
                <div className={styles.details}>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Plan:</span>
                    <span className={styles.value}>
                      {subscriptionData.planName}
                    </span>
                  </div>
                  {subscriptionData.amount && (
                    <div className={styles.detailRow}>
                      <span className={styles.label}>Amount:</span>
                      <span className={styles.value}>
                        ${subscriptionData.amount}
                      </span>
                    </div>
                  )}
                  {subscriptionData.startDate && (
                    <div className={styles.detailRow}>
                      <span className={styles.label}>Start Date:</span>
                      <span className={styles.value}>
                        {new Date(
                          subscriptionData.startDate
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {subscriptionData.endDate && (
                    <div className={styles.detailRow}>
                      <span className={styles.label}>Valid Until:</span>
                      <span className={styles.value}>
                        {new Date(
                          subscriptionData.endDate
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <p className={styles.redirect}>
                Redirecting to dashboard in 3 seconds...
              </p>

              <button
                className={styles.button}
                onClick={() => navigate("/dashboard")}
              >
                Go to Dashboard Now
              </button>
            </div>
          )}

          {status === "error" && (
            <div className={styles.error}>
              <div className={styles.icon}>✕</div>
              <h2>Payment Verification Failed</h2>
              <p className={styles.message}>{message}</p>

              <div className={styles.actions}>
                <button
                  className={styles.button}
                  onClick={() => navigate("/pricing")}
                >
                  Try Again
                </button>
                <button
                  className={`${styles.button} ${styles.secondary}`}
                  onClick={() => navigate("/support")}
                >
                  Contact Support
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
