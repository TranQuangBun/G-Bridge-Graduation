import React, { useState } from "react";
import styles from "./PaymentGatewayModal.module.css";

const PaymentGatewayModal = ({
  plan,
  onClose,
  onSelectGateway,
  processing,
}) => {
  const [selectedGateway, setSelectedGateway] = useState(null);

  const handleProceed = () => {
    if (selectedGateway) {
      onSelectGateway(selectedGateway);
    }
  };

  return (
    <div className={styles.overlay} onClick={!processing ? onClose : undefined}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Select Payment Method</h3>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            disabled={processing}
          >
            ×
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.planInfo}>
            <h4>{plan.name}</h4>
            <p className={styles.price}>
              ${plan.displayPrice} / {plan.priceSuffix}
            </p>
            {plan.discountPercent > 0 && (
              <span className={styles.discount}>
                Save {plan.discountPercent}%
              </span>
            )}
          </div>

          <div className={styles.gatewayOptions}>
            <div
              className={`${styles.gatewayCard} ${
                selectedGateway === "vnpay" ? styles.selected : ""
              }`}
              onClick={() => !processing && setSelectedGateway("vnpay")}
            >
              <div className={styles.gatewayIcon}>
                <span className={styles.vnpayIcon}>🏦</span>
              </div>
              <div className={styles.gatewayInfo}>
                <h5>VNPay</h5>
                <p>Vietnamese Banks & E-wallets</p>
                <ul className={styles.methods}>
                  <li>✓ Domestic cards</li>
                  <li>✓ Bank transfer</li>
                  <li>✓ MoMo, ZaloPay</li>
                </ul>
              </div>
              {selectedGateway === "vnpay" && (
                <div className={styles.checkmark}>✓</div>
              )}
            </div>

            <div
              className={`${styles.gatewayCard} ${
                selectedGateway === "paypal" ? styles.selected : ""
              }`}
              onClick={() => !processing && setSelectedGateway("paypal")}
            >
              <div className={styles.gatewayIcon}>
                <span className={styles.paypalIcon}>💳</span>
              </div>
              <div className={styles.gatewayInfo}>
                <h5>PayPal</h5>
                <p>International Cards & PayPal Account</p>
                <ul className={styles.methods}>
                  <li>✓ Credit/Debit cards</li>
                  <li>✓ PayPal balance</li>
                  <li>✓ Bank account</li>
                </ul>
              </div>
              {selectedGateway === "paypal" && (
                <div className={styles.checkmark}>✓</div>
              )}
            </div>
          </div>

          <div className={styles.footer}>
            <button
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={processing}
            >
              Cancel
            </button>
            <button
              className={styles.proceedBtn}
              onClick={handleProceed}
              disabled={!selectedGateway || processing}
            >
              {processing ? "Processing..." : "Proceed to Payment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentGatewayModal;
