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
    monthly: 10,
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
    monthly: 15,
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
    monthly: 21,
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
  const [billing, setBilling] = useState("monthly");
  const [openPlan, setOpenPlan] = useState(null); // plan object for payment modal
  const [purchased, setPurchased] = useState({}); // { planKey: true }
  const [processing, setProcessing] = useState(false);
  const [backendPlans, setBackendPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  const YEARLY_DISCOUNT = 10; // percent
  const basePlans = useMemo(() => planDefinitions(t), [t]);
  const plans = useMemo(
    () =>
      basePlans.map((p) => {
        if (billing === "monthly") {
          return {
            ...p,
            displayPrice: p.monthly,
            priceSuffix: "mo",
            discountPercent: 0,
          };
        }
        // yearly total = monthly * 12 with discount
        const fullYear = p.monthly * 12;
        const discounted = Math.round(fullYear * (1 - YEARLY_DISCOUNT / 100));
        return {
          ...p,
          displayPrice: discounted,
          fullYear,
          monthlyEquivalent: p.monthly,
          priceSuffix: "yr",
          discountPercent: p.monthly > 0 ? YEARLY_DISCOUNT : 0,
        };
      }),
    [billing, basePlans]
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

      // Find backend plan ID (for now use key mapping)
      // In production, you should map frontend plans to backend plan IDs
      const planIdMap = {
        free: 1,
        pro: 3,
        team: 3, // map to pro for now
        enterprise: 4,
      };

      const planId = planIdMap[openPlan.key] || 3;

      if (gateway === "vnpay") {
        const response = await paymentService.createVNPayPayment(planId);
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
        const response = await paymentService.createPayPalPayment(planId);
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
            <div className={styles.toggleRow}>
              <div className={styles.billingToggle}>
                <button
                  className={billing === "monthly" ? styles.active : ""}
                  onClick={() => setBilling("monthly")}
                >
                  {t("pricingPage.monthly")}
                </button>
                <button
                  className={billing === "yearly" ? styles.active : ""}
                  onClick={() => setBilling("yearly")}
                >
                  {t("pricingPage.yearly")}
                </button>
              </div>
              {billing === "yearly" && (
                <span className={styles.saveBadge}>
                  {t("pricingPage.save")}
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
                      <span className={styles.price}>
                        {plan.displayPrice === 0
                          ? "Free"
                          : `$${plan.displayPrice}`}
                      </span>
                      {plan.displayPrice !== 0 && (
                        <span className={styles.per}>/ {plan.priceSuffix}</span>
                      )}
                      {billing === "yearly" && plan.discountPercent > 0 && (
                        <span className={styles.discountNote}>
                          - {plan.discountPercent}%
                        </span>
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
