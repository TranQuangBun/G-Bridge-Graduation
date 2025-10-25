import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PricingPage.module.css";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import PaymentGatewayModal from "../../components/PaymentGatewayModal/PaymentGatewayModal";
import * as paymentService from "../../services/paymentService";

const planDefinitions = (t) => [
  {
    key: "free",
    name: t("pricingPage.plan.starterName"),
    tag: t("pricingPage.plan.freeTag"),
    monthly: 0,
    desc: t("pricingPage.plan.starterDesc"),
    features: [
      t("pricingPage.plan.feature.profile"),
      t("pricingPage.plan.feature.apply1"),
      t("pricingPage.plan.feature.basicEmailNotifications"),
      t("pricingPage.plan.feature.communityAccess"),
    ],
    outline: true,
  },
  {
    key: "pro",
    name: t("pricingPage.plan.proName"),
    tag: t("pricingPage.plan.popularTag"),
    monthly: 5, // Match database: Basic Plan = $5.00
    desc: t("pricingPage.plan.proDesc"),
    features: [
      t("pricingPage.plan.feature.unlimitedApply"),
      t("pricingPage.plan.feature.aiMatch"),
      t("pricingPage.plan.feature.advFilters"),
      t("pricingPage.plan.feature.prioritySupport"),
      t("pricingPage.plan.feature.export"),
    ],
    popular: true,
  },
  {
    key: "team",
    name: t("pricingPage.plan.teamName"),
    tag: t("pricingPage.plan.growthTag"),
    monthly: 12, // Match database: Pro Plan = $12.00
    desc: t("pricingPage.plan.teamDesc"),
    features: [
      t("pricingPage.plan.feature.teamMembers"),
      t("pricingPage.plan.feature.analytics"),
      t("pricingPage.plan.feature.sharedPool"),
      t("pricingPage.plan.feature.bulk"),
      t("pricingPage.plan.feature.roles"),
      t("pricingPage.plan.feature.prioritySearch"),
    ],
  },
  {
    key: "enterprise",
    name: t("pricingPage.plan.enterpriseName"),
    tag: t("pricingPage.plan.customTag"),
    monthly: 20, // Match database: Enterprise Plan = $20.00
    desc: t("pricingPage.plan.enterpriseDesc"),
    features: [
      t("pricingPage.plan.feature.unlimitedMembers"),
      t("pricingPage.plan.feature.successManager"),
      t("pricingPage.plan.feature.integrations"),
      t("pricingPage.plan.feature.securityReports"),
      t("pricingPage.plan.feature.sla"),
      t("pricingPage.plan.feature.earlyAccess"),
    ],
  },
];

export default function PricingPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [openPlan, setOpenPlan] = useState(null); // plan object for payment modal
  const [purchased, setPurchased] = useState({}); // { planKey: true }
  const [processing, setProcessing] = useState(false);
  const [backendPlans, setBackendPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [billingCycle, setBillingCycle] = useState("monthly"); // 'monthly' or 'yearly'

  // Toggle between monthly and yearly
  const toggleBillingCycle = () => {
    setBillingCycle((prev) => (prev === "monthly" ? "yearly" : "monthly"));
  };

  const basePlans = useMemo(() => planDefinitions(t), [t]);

  // Calculate prices based on billing cycle
  const plans = useMemo(
    () =>
      basePlans.map((p) => {
        const isYearly = billingCycle === "yearly";
        const monthlyPrice = p.monthly;

        // Yearly: 12 months * 80% = 9.6 months price (20% discount)
        const yearlyPrice = isYearly ? Math.round(monthlyPrice * 12 * 0.8) : 0;
        const yearlyMonthlyEquivalent = isYearly
          ? Math.round((yearlyPrice / 12) * 100) / 100
          : 0;

        return {
          ...p,
          // Display the actual price users will pay
          displayPrice: isYearly ? yearlyPrice : monthlyPrice,
          // For yearly, also show the monthly equivalent
          monthlyEquivalent: yearlyMonthlyEquivalent,
          fullPrice: isYearly ? yearlyPrice : monthlyPrice,
          priceSuffix: isYearly ? "yr" : "mo",
          discountPercent: isYearly ? 20 : 0,
          isYearly: isYearly,
        };
      }),
    [basePlans, billingCycle]
  );

  // Load backend plans on mount (optional - can use hardcoded plans)
  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoadingPlans(true);
        const data = await paymentService.getSubscriptionPlans();
        setBackendPlans(data.plans || []);
      } catch (error) {
        console.error("Failed to load subscription plans:", error);
        // Fall back to hardcoded plans
      } finally {
        setLoadingPlans(false);
      }
    };
    loadPlans();
  }, []);

  // Check if user is already subscribed
  useEffect(() => {
    const checkSubscription = async () => {
      if (!paymentService.isAuthenticated()) return;

      try {
        const data = await paymentService.getSubscriptionStatus();
        if (data.active) {
          // Mark the subscribed plan as purchased
          const planKey = data.planName?.toLowerCase() || "pro";
          setPurchased({ [planKey]: true });
        }
      } catch (error) {
        console.error("Failed to check subscription:", error);
      }
    };
    checkSubscription();
  }, []);

  function openCheckout(plan) {
    if (purchased[plan.key]) return; // already bought

    // Check if user is authenticated
    if (!paymentService.isAuthenticated()) {
      alert(t("pricingPage.pay.loginRequired") || "Please login to upgrade");
      navigate("/login");
      return;
    }

    // Open payment gateway modal with plan data
    setOpenPlan(plan);
  }

  async function handleSelectGateway(gateway) {
    if (!openPlan) return;

    try {
      setProcessing(true);

      // Map frontend plan keys to backend plan IDs
      const planIdMap = {
        free: 1, // Free Plan - $0
        pro: 2, // Basic Plan - $5
        team: 3, // Pro Plan - $12
        enterprise: 4, // Enterprise Plan - $20
      };

      const planId = planIdMap[openPlan.key] || 2;

      // Determine billing cycle
      const billingCycleParam = openPlan.isYearly ? "yearly" : "monthly";

      // Calculate final amount based on billing cycle
      // For yearly: use fullPrice (already calculated with 20% discount)
      // For monthly: use monthly price
      const finalAmount = openPlan.isYearly
        ? openPlan.fullPrice
        : openPlan.monthly;

      console.log("Payment info:", {
        plan: openPlan.name,
        cycle: billingCycleParam,
        displayPrice: openPlan.displayPrice,
        fullPrice: openPlan.fullPrice,
        finalAmount: finalAmount,
        discount: openPlan.discountPercent,
      });

      if (gateway === "vnpay") {
        // Pass billing cycle to backend
        const response = await paymentService.createVNPayPayment(
          planId,
          billingCycleParam
        );
        console.log("VNPay payment response:", response);

        // Backend returns: { success, message, data: { paymentUrl, orderId, ... } }
        const paymentUrl = response.data?.paymentUrl || response.paymentUrl;

        if (paymentUrl) {
          // Show brief success message before redirect
          console.log("Redirecting to VNPay payment page...");
          // Redirect to VNPay payment page (will leave the current page)
          setTimeout(() => {
            paymentService.redirectToPayment(paymentUrl);
          }, 500);
        } else {
          throw new Error("Payment URL not received from VNPay");
        }
      } else if (gateway === "paypal") {
        // Pass billing cycle to backend
        const response = await paymentService.createPayPalPayment(
          planId,
          billingCycleParam
        );
        console.log("PayPal payment response:", response);

        // Backend returns: { success, message, data: { paymentUrl, orderId, ... } }
        const paymentUrl = response.data?.paymentUrl || response.paymentUrl;

        if (paymentUrl) {
          // Show brief success message before redirect
          console.log("Redirecting to PayPal payment page...");
          // Redirect to PayPal payment page (will leave the current page)
          setTimeout(() => {
            paymentService.redirectToPayment(paymentUrl);
          }, 500);
        } else {
          throw new Error("Payment URL not received from PayPal");
        }
      }
      // Note: Don't set processing to false here because we're redirecting away
    } catch (error) {
      console.error("Payment creation failed:", error);
      alert(
        error.response?.data?.message ||
          t("pricingPage.pay.error") ||
          "Payment failed. Please try again."
      );
      setProcessing(false);
      setOpenPlan(null); // Close modal on error
    }
  }

  function closePaymentModal() {
    if (processing) return;
    setOpenPlan(null);
  }

  const currentPlan = openPlan;

  return (
    <MainLayout>
      <div className={styles.pricingPageRoot}>
        <div className={styles.container}>
          <div className={styles.hero}>
            <div className={styles.badge}>{t("pricingPage.heroBadge")}</div>
            <h1 className={styles.title}>{t("pricingPage.heroTitle")}</h1>
            <p className={styles.subtitle}>{t("pricingPage.heroSubtitle")}</p>

            {/* Billing Cycle Toggle */}
            <div className={styles.billingToggle}>
              <span
                className={
                  billingCycle === "monthly" ? styles.activeToggle : ""
                }
              >
                {t("pricingPage.monthly")}
              </span>
              <button
                className={styles.toggleSwitch}
                onClick={toggleBillingCycle}
                aria-label="Toggle billing cycle"
              >
                <span
                  className={styles.toggleSlider}
                  data-yearly={billingCycle === "yearly"}
                ></span>
              </button>
              <span
                className={billingCycle === "yearly" ? styles.activeToggle : ""}
              >
                {t("pricingPage.yearly")}
              </span>
              {billingCycle === "yearly" && (
                <span className={styles.saveBadge}>
                  {t("pricingPage.save")} 20%
                </span>
              )}
            </div>
          </div>

          <div className={styles.plansGrid}>
            {plans.map((plan) => {
              const isBought = purchased[plan.key];
              return (
                <div
                  key={plan.key}
                  className={
                    plan.popular
                      ? `${styles.planCard} ${styles.popular}`
                      : styles.planCard
                  }
                >
                  <div className={styles.planHeader}>
                    <span className={styles.planTag}>{plan.tag}</span>
                    <h3 className={styles.planName}>{plan.name}</h3>
                    <div className={styles.priceWrap}>
                      {plan.discountPercent > 0 && (
                        <div className={styles.discountBadge}>
                          -{plan.discountPercent}%
                        </div>
                      )}
                      <span className={styles.price}>
                        {plan.displayPrice === 0
                          ? "Free"
                          : `$${plan.displayPrice}`}
                      </span>
                      {plan.displayPrice !== 0 && (
                        <span className={styles.per}>/ {plan.priceSuffix}</span>
                      )}
                      {plan.isYearly && plan.monthlyEquivalent > 0 && (
                        <div className={styles.billedYearly}>
                          (${plan.monthlyEquivalent}/mo equivalent)
                        </div>
                      )}
                    </div>
                    <p className={styles.desc}>{plan.desc}</p>
                  </div>
                  <ul className={styles.featureList}>
                    {plan.features.map((f) => (
                      <li key={f} className={styles.featureItem}>
                        <i>✓</i>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    disabled={isBought}
                    onClick={() => openCheckout(plan)}
                    className={
                      plan.outline
                        ? `${styles.ctaBtn} ${styles.outline}`
                        : styles.ctaBtn
                    }
                    style={
                      isBought
                        ? { opacity: 0.55, cursor: "default" }
                        : undefined
                    }
                  >
                    {isBought
                      ? t("pricingPage.plan.ctaPurchased")
                      : t("pricingPage.plan.ctaGetStarted")}
                  </button>
                </div>
              );
            })}
          </div>

          <div className={styles.comparison}>
            <h2 className={styles.comparisonTitle}>
              {t("pricingPage.whyTitle")}
            </h2>
            <div className={styles.comparisonGrid}>
              <div className={styles.compBlock}>
                <span className={styles.badgeMini}>
                  {t("pricingPage.why.match.badge")}
                </span>
                <h3 className={styles.compName}>
                  {t("pricingPage.why.match.title")}
                </h3>
                <p className={styles.compDesc}>
                  {t("pricingPage.why.match.desc")}
                </p>
              </div>
              <div className={styles.compBlock}>
                <span className={styles.badgeMini}>
                  {t("pricingPage.why.team.badge")}
                </span>
                <h3 className={styles.compName}>
                  {t("pricingPage.why.team.title")}
                </h3>
                <p className={styles.compDesc}>
                  {t("pricingPage.why.team.desc")}
                </p>
              </div>
              <div className={styles.compBlock}>
                <span className={styles.badgeMini}>
                  {t("pricingPage.why.scale.badge")}
                </span>
                <h3 className={styles.compName}>
                  {t("pricingPage.why.scale.title")}
                </h3>
                <p className={styles.compDesc}>
                  {t("pricingPage.why.scale.desc")}
                </p>
              </div>
              <div className={styles.compBlock}>
                <span className={styles.badgeMini}>
                  {t("pricingPage.why.trust.badge")}
                </span>
                <h3 className={styles.compName}>
                  {t("pricingPage.why.trust.title")}
                </h3>
                <p className={styles.compDesc}>
                  {t("pricingPage.why.trust.desc")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Real Payment Gateway Modal */}
        {openPlan && currentPlan && (
          <PaymentGatewayModal
            plan={currentPlan}
            onClose={closePaymentModal}
            onSelectGateway={handleSelectGateway}
            processing={processing}
          />
        )}
      </div>
    </MainLayout>
  );
}
