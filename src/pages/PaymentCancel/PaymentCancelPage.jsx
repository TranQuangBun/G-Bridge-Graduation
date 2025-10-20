import React from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "../../layouts";
import styles from "./PaymentCancelPage.module.css";

export default function PaymentCancelPage() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.icon}>⚠</div>
          <h2>Payment Cancelled</h2>
          <p className={styles.message}>
            Your payment was cancelled. No charges have been made to your
            account.
          </p>
          <p className={styles.submessage}>
            If you encountered any issues or have questions, please don't
            hesitate to contact our support team.
          </p>

          <div className={styles.actions}>
            <button
              className={styles.button}
              onClick={() => navigate("/pricing")}
            >
              Try Again
            </button>
            <button
              className={`${styles.button} ${styles.secondary}`}
              onClick={() => navigate("/")}
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
